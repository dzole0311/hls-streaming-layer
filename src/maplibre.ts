import type Hls from 'hls.js';
import type { Map, VideoSource, RasterLayerSpecification } from 'maplibre-gl';
import { WORLD_COORDINATES, type Coordinates, type HlsStreamingLayerHandle } from './types';
import { attachHlsToVideo, createSeedVideoUrl } from './hls-video';

/**
 * Options for creating an HLS video layer on a MapLibre GL map.
 */
export interface HlsStreamingLayerMapLibreOptions {
  id?: string;
  url: string;
  coordinates?: Coordinates;
  paint?: RasterLayerSpecification['paint'];
  beforeId?: string;
  hlsConfig?: Partial<Hls['config']>;
  onLoad?: (video: HTMLVideoElement) => void;
  onError?: (error: { type: string; details: string; fatal: boolean }) => void;
}

/**
 * Add an HLS video stream as a raster layer on a MapLibre GL map.
 *
 * Creates a MapLibre video source with a placeholder MP4, waits for MapLibre to
 * create the internal video element, then attaches hls.js for adaptive streaming.
 * On Safari, native HLS playback is used instead of hls.js.
 *
 * @param map A MapLibre GL map instance. The map style may be loaded or still loading.
 * @param options Configuration for the video layer. See {@link HlsStreamingLayerMapLibreOptions}.
 * @returns A handle with methods to control and clean up the layer.
 *
 * @example
 * ```ts
 * import maplibregl from 'maplibre-gl';
 * import { addHlsLayerMapLibre } from 'hls-streaming-layer/maplibre';
 *
 * const map = new maplibregl.Map({ container: 'map', style: 'https://demotiles.maplibre.org/style.json' });
 *
 * map.on('load', () => {
 *   const layer = addHlsLayerMapLibre(map, {
 *     url: 'https://example.com/stream/playlist.m3u8',
 *     coordinates: [[-10, 55], [5, 55], [5, 45], [-10, 45]],
 *     paint: { 'raster-opacity': 0.8 },
 *     onLoad: (video) => console.log('Stream playing'),
 *     onError: (err) => console.error(err.details),
 *   });
 *
 *   layer.setUrl('https://example.com/other/playlist.m3u8');
 *   layer.destroy();
 * });
 * ```
 */
export function addHlsLayerMapLibre(
  map: Map,
  options: HlsStreamingLayerMapLibreOptions,
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

  const seedUrl = createSeedVideoUrl();

  /**
   * Register the video source and raster layer on the map.
   * No-op if they already exist.
   */
  function addSourceAndLayer() {
    if (map.getSource(sourceId)) return;

    map.addSource(sourceId, {
      type: 'video',
      urls: [seedUrl],
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
   *
   * @param video The video element from the MapLibre video source.
   * @param hlsUrl The HLS playlist URL to load.
   */
  function attachHls(video: HTMLVideoElement, hlsUrl: string) {
    if (hls) {
      hls.destroy();
      hls = null;
    }
    hls = attachHlsToVideo(video, hlsUrl, { hlsConfig, onLoad, onError });
  }

  /**
   * Add the source and layer then poll every 50ms for the video element
   * that MapLibre creates asynchronously. Stops polling once found or destroyed.
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
        clearInterval(pollId!);
        pollId = null;
        videoEl = video;
        attachHls(video, url);
      }
    }, 50);
  }

  if (map.isStyleLoaded()) {
    init();
  } else {
    map.once('idle', init);
  }

  return {
    /**
     * Remove the layer and source from the map, destroy the HLS instance,
     * and free the placeholder blob URL.
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
      } catch {}
      if (seedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(seedUrl);
      }
    },

    /**
     * Returns the HTML video element created by MapLibre, or null if not yet initialized.
     */
    getVideo() {
      return videoEl;
    },

    /**
     * Switch to a different HLS stream without removing the layer.
     *
     * @param newUrl The new .m3u8 playlist URL.
     */
    setUrl(newUrl: string) {
      if (videoEl) attachHls(videoEl, newUrl);
    },
  };
}
