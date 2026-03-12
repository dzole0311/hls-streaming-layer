import Hls from 'hls.js';
import type { Map, VideoSource } from 'mapbox-gl';
import {
  WORLD_COORDINATES,
  type HlsStreamingLayerOptions,
  type HlsStreamingLayerHandle,
} from './types';

/**
 * Add an HLS video stream as a raster layer on a Mapbox GL map.
 *
 * This works by creating a Mapbox video source with a tiny placeholder MP4,
 * waiting for Mapbox to create the internal video element, and then attaching
 * hls.js to that element for adaptive streaming.
 *
 * On Safari, native HLS playback is used instead of hls.js since Safari
 * does not support Media Source Extensions.
 *
 * @param map A Mapbox GL map instance. The map style should be loaded or loading.
 * @param options Configuration for the video layer. See {@link HlsStreamingLayerOptions}.
 * @returns A handle with methods to control and clean up the layer.
 *
 * @example
 * ```ts
 * import { addHlsLayer } from 'hls-streaming-layer';
 *
 * const layer = addHlsLayer(map, {
 *   url: 'https://example.com/stream/playlist.m3u8',
 *   paint: { 'raster-opacity': 0.7 },
 * });
 *
 * // Switch to a different stream later:
 * layer.setUrl('https://example.com/other/playlist.m3u8');
 *
 * // Clean up when done:
 * layer.destroy();
 * ```
 */
export function addHlsLayer(
  map: Map,
  options: HlsStreamingLayerOptions,
): HlsStreamingLayerHandle {
  const {
    id = 'hls-video',
    url,
    coordinates = WORLD_COORDINATES,
    paint = { 'raster-opacity': 0.75, 'raster-fade-duration': 0 },
    beforeId,
    hlsConfig,
    onLoad,
    onError,
  } = options;

  const sourceId = `${id}-source`;
  const layerId = `${id}-layer`;

  let hls: Hls | null = null;
  let videoEl: HTMLVideoElement | null = null;
  let pollId: ReturnType<typeof setInterval> | null = null;
  let destroyed = false;

  /*
   * Mapbox video sources require a URL when created, but we want to use
   * hls.js to handle the actual streaming. So we create a tiny inline
   * MP4 as a blob URL to satisfy the initial source creation. Once the
   * video element exists, hls.js takes over completely.
   */
  const placeholderUrl = createPlaceholderBlob();

  /**
   * Register the video source and raster layer on the map.
   * This is a no op if they already exist (prevents duplicates on re init).
   */
  function addSourceAndLayer() {
    if (map.getSource(sourceId)) return;

    map.addSource(sourceId, {
      type: 'video',
      urls: [placeholderUrl],
      coordinates,
    });

    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint,
      },
      beforeId,
    );
  }

  /**
   * Connect hls.js (or native HLS on Safari) to the video element.
   * If an existing HLS instance is running, it gets destroyed first
   * so we can cleanly swap to a new URL.
   *
   * @param video The video element from the Mapbox video source.
   * @param hlsUrl The HLS playlist URL to load.
   */
  function attachHls(video: HTMLVideoElement, hlsUrl: string) {
    if (hls) {
      hls.destroy();
      hls = null;
    }

    video.loop = true;
    video.muted = true;

    if (Hls.isSupported()) {
      hls = new Hls(hlsConfig);
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      /*
       * Once the manifest is parsed and levels are known,
       * start playback and notify the caller.
       */
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        onLoad?.(video);
      });

      /*
       * Only surface fatal errors to the caller. Non fatal errors
       * are handled internally by hls.js with automatic recovery.
       */
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          onError?.({
            type: data.type,
            details: data.details,
            fatal: true,
          });
          hls?.destroy();
          hls = null;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      /*
       * Safari supports HLS natively through the video element.
       * We just set the src and let the browser handle it.
       */
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        onLoad?.(video);
      }, { once: true });
    } else {
      onError?.({
        type: 'UNSUPPORTED',
        details: 'HLS is not supported in this browser',
        fatal: true,
      });
    }
  }

  /**
   * Set up the source, layer, and start polling for the video element.
   *
   * Mapbox creates the video element asynchronously after the source is added.
   * We poll every 50ms until the element appears, then attach HLS to it.
   * Polling stops as soon as the element is found or the layer is destroyed.
   */
  function init() {
    if (destroyed) return;
    addSourceAndLayer();

    pollId = setInterval(() => {
      if (destroyed) {
        if (pollId) clearInterval(pollId);
        return;
      }
      const source = map.getSource(sourceId) as VideoSource | undefined;
      if (!source) return;

      const video = source.getVideo();
      if (video) {
        if (pollId) clearInterval(pollId);
        pollId = null;
        videoEl = video;
        attachHls(video, url);
      }
    }, 50);
  }

  /*
   * If the map style is already loaded, initialize right away.
   * Otherwise wait for the map to be idle (style fully loaded)
   * before adding sources and layers.
   */
  if (map.isStyleLoaded()) {
    init();
  } else {
    map.once('idle', init);
  }

  const handle: HlsStreamingLayerHandle = {
    /**
     * Tear down everything: stop polling, destroy the HLS instance,
     * remove the layer and source from the map, and free the
     * placeholder blob URL.
     */
    destroy() {
      destroyed = true;
      if (pollId) {
        clearInterval(pollId);
        pollId = null;
      }
      if (hls) {
        hls.destroy();
        hls = null;
      }
      videoEl = null;
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // The map itself may have already been removed from the DOM.
      }
      if (placeholderUrl.startsWith('blob:')) {
        URL.revokeObjectURL(placeholderUrl);
      }
    },

    /**
     * Returns the HTML video element if it has been created by Mapbox.
     * Returns null if the layer has not finished initializing yet.
     */
    getVideo() {
      return videoEl;
    },

    /**
     * Switch to a different HLS stream without removing the layer.
     * The current HLS instance is torn down and a new one is created,
     * reusing the same video element and map layer.
     *
     * @param newUrl The new .m3u8 playlist URL.
     */
    setUrl(newUrl: string) {
      if (videoEl) {
        attachHls(videoEl, newUrl);
      }
    },
  };

  return handle;
}

/**
 * Create a tiny valid MP4 file and return it as a blob URL.
 *
 * Mapbox video sources require at least one URL when created, but we do not
 * want to load an actual video file from the network. Instead, we generate
 * a minimal 1x1 pixel MP4 in memory. Once hls.js takes over the video
 * element, this placeholder is no longer used.
 *
 * In non browser environments (like SSR), falls back to a data URI since
 * blob URLs are not available.
 *
 * @returns A blob URL (or data URI) pointing to a minimal MP4 file.
 */
function createPlaceholderBlob(): string {
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
