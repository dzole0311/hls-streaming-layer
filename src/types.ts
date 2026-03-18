import type Hls from 'hls.js';
import type { RasterLayerSpecification } from 'mapbox-gl';

/**
 * Four corner positions that define where the video is placed on the map.
 * Order: top-left, top-right, bottom-right, bottom-left.
 * Each entry is a [longitude, latitude] pair.
 */
export type Coordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

/**
 * Full world extent using Web Mercator limits in [TL, TR, BR, BL] corner order.
 * Use this when you want the video to span the entire map.
 */
export const WORLD_COORDINATES: Coordinates = [
  [-180, 85],
  [180, 85],
  [180, -85],
  [-180, -85],
];

/**
 * Options for creating an HLS video layer on a Mapbox GL map.
 */
export interface HlsStreamingLayerOptions {
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
 * Handle returned by `addHlsLayer` and `addHlsLayerMapLibre` with methods
 * to control and clean up the video layer.
 */
export interface HlsStreamingLayerHandle {
  destroy: () => void;
  getVideo: () => HTMLVideoElement | null;
  setUrl: (url: string) => void;
}
