import type Hls from 'hls.js';
import type { RasterLayerSpecification } from 'mapbox-gl';

/**
 * Four corner positions that define where the video is placed on the map.
 * Order: top left, top right, bottom right, bottom left.
 * Each entry is a [longitude, latitude] pair.
 */
export type Coordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

/**
 * Covers the full world extent using Web Mercator limits.
 * Use this when you want the video to span the entire map.
 */
export const WORLD_COORDINATES: Coordinates = [
  [-180, 85],
  [180, 85],
  [180, -85],
  [-180, -85],
];

/**
 * Options for creating an HLS video layer on a Mapbox map.
 */
export interface HlsStreamingLayerOptions {
  /**
   * A unique prefix used for the Mapbox source and layer IDs.
   * Useful when you need multiple video layers on the same map.
   * @default "hls-video"
   */
  id?: string;

  /**
   * The URL of the HLS playlist (.m3u8 file).
   * This is the only required option.
   */
  url: string;

  /**
   * Four corner coordinates that define where the video sits on the map.
   * If not provided, the video will cover the entire world.
   * @default WORLD_COORDINATES
   */
  coordinates?: Coordinates;

  /**
   * Mapbox raster paint properties to style the video layer.
   * You can control things like opacity, brightness, contrast, and saturation.
   * @see https://docs.mapbox.com/style-spec/reference/layers/raster/#paint-properties
   */
  paint?: RasterLayerSpecification['paint'];

  /**
   * The ID of an existing Mapbox layer.
   * The video layer will be inserted right below this layer in the stack.
   * Helpful for keeping labels or other layers visible on top of the video.
   */
  beforeId?: string;

  /**
   * Configuration options passed directly to the hls.js constructor.
   * Use this to fine tune buffering, ABR behavior, and other HLS settings.
   * @see https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning
   */
  hlsConfig?: Partial<Hls['config']>;

  /**
   * Called once the HLS manifest is parsed and the video starts playing.
   * Receives the underlying HTML video element as its argument.
   *
   * @param video The video element that Mapbox created internally.
   */
  onLoad?: (video: HTMLVideoElement) => void;

  /**
   * Called when a fatal HLS error occurs and playback cannot continue.
   *
   * @param error An object with the error type, details message, and fatal flag.
   */
  onError?: (error: { type: string; details: string; fatal: boolean }) => void;
}

/**
 * A handle returned by `addHlsLayer` that lets you control the video layer
 * after it has been added to the map.
 */
export interface HlsStreamingLayerHandle {
  /**
   * Remove the video layer and source from the map, and tear down
   * the HLS instance. Always call this when you are done with the layer
   * to avoid memory leaks.
   */
  destroy: () => void;

  /**
   * Returns the underlying HTML video element that Mapbox created.
   * Will return null if the video has not been initialized yet.
   */
  getVideo: () => HTMLVideoElement | null;

  /**
   * Switch to a different HLS stream URL without removing and re adding
   * the layer. The old HLS instance is destroyed and a new one is created
   * using the same video element.
   *
   * @param url The new HLS playlist URL (.m3u8) to load.
   */
  setUrl: (url: string) => void;
}
