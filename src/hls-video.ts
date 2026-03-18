import Hls from 'hls.js';

/**
 * Options for attaching an HLS stream to a video element.
 */
export interface AttachHlsOptions {
  hlsConfig?: Partial<Hls['config']>;
  onLoad?: (video: HTMLVideoElement) => void;
  onError?: (error: { type: string; details: string; fatal: boolean }) => void;
}

/**
 * Attach an HLS stream to an HTMLVideoElement using hls.js or native HLS.
 *
 * Uses hls.js on browsers that support Media Source Extensions.
 * Falls back to native HLS on Safari. Reports an unsupported error
 * if neither method is available.
 *
 * @param video The video element to attach the stream to.
 * @param url The HLS playlist URL (.m3u8).
 * @param options Callbacks and hls.js configuration.
 * @returns The new Hls instance for MSE-based playback, or null for native or unsupported browsers.
 *
 * @example
 * ```ts
 * const video = document.createElement('video');
 * const hls = attachHlsToVideo(video, 'https://example.com/stream.m3u8', {
 *   onLoad: (v) => console.log('Playing', v.duration),
 *   onError: (e) => console.error(e.details),
 * });
 * ```
 */
export function attachHlsToVideo(
  video: HTMLVideoElement,
  url: string,
  options: AttachHlsOptions,
): Hls | null {
  video.loop = true;
  video.muted = true;
  video.playsInline = true;

  if (Hls.isSupported()) {
    const hls = new Hls(options.hlsConfig);
    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
      options.onLoad?.(video);
    });

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) {
        options.onError?.({ type: data.type, details: data.details, fatal: true });
        hls.destroy();
      }
    });

    return hls;
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.addEventListener(
      'loadedmetadata',
      () => {
        video.play().catch(() => {});
        options.onLoad?.(video);
      },
      { once: true },
    );
    return null;
  } else {
    options.onError?.({
      type: 'UNSUPPORTED',
      details: 'HLS is not supported in this browser',
      fatal: true,
    });
    return null;
  }
}

/**
 * Create a minimal valid MP4 as a blob URL (or data URI in SSR environments).
 *
 * Map video sources require a URL at creation time, before hls.js takes over.
 * This generates a 1×1 pixel MP4 in memory to seed the source without making
 * a network request. Once hls.js attaches to the video element the seed URL
 * is no longer used.
 *
 * @returns A blob URL or data URI pointing to a minimal MP4.
 */
export function createSeedVideoUrl(): string {
  const base64 =
    'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0AAACrgYF' +
    '//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzA5NSBiYWVlNDAwIC0gSC4y' +
    'NjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyNCAtIGh0dHA6Ly93d3cu' +
    'dmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9j' +
    'az0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9' +
    'MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9' +
    'MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3Fw' +
    'X29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFk' +
    'cz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0' +
    'cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9' +
    'MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBr' +
    'ZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9' +
    'NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02' +
    'OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAACWWIhAAh//73aAAAAwBt' +
    'b292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAACgABAAABAAAAAAAAAAAAAAAAAQAAAAAAAA' +
    'AAAAAAAAAAAQAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAB' +
    'xHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAQ' +
    'AAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAFgbWRpYQAAACBtZGhkAAAAAAAA' +
    'AAAAAAAAAAAoAAAAAgBVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAAAVaWRlb0hh' +
    'bmRsZXIAAAABAW1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAA' +
    'AAAAAQAAAAx1cmwgAAAAAQAAAMFzdGJsAAAAlXN0c2QAAAAAAAAAAQAAAIVhdmMxAAAAAAAA' +
    'AAEAAAAAAAAAAAAAAAAAAAAAAQABAAAAAABISAAAAAAOAAAAABAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAGP//AAAAM2F2Y0MBZAAf/+EAGWdkAB+s2UBIAP0AAB9AAAdTAL' +
    'jywAAAABhzdHRzAAAAAAAAAAEAAAABAAAAAQAAABRzdHNzAAAAAAAAAAEAAAABAAAAEHN0c2MA' +
    'AAAAAAAAAAAAABRzdHN6AAAAAAAAAAAAAAABAAAChAAAABRzdGNvAAAAAAAAAAEAAAA4';

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
  } catch {
    return 'data:video/mp4;base64,' + base64;
  }
}
