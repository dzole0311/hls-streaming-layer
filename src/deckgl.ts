import type Hls from 'hls.js';
import { BitmapLayer } from '@deck.gl/layers';
import { attachHlsToVideo } from './hls-video';
import type { Coordinates } from './types';

/**
 * Full world bounds for deck.gl BitmapLayer as [west, south, east, north].
 */
export const WORLD_BOUNDS_DECK: [number, number, number, number] = [-180, -85, 180, 85];

/**
 * Bounds for a deck.gl BitmapLayer.
 * Either `[west, south, east, north]` or four corner {@link Coordinates} in
 * [topLeft, topRight, bottomRight, bottomLeft] order.
 */
export type DeckBounds = [number, number, number, number] | Coordinates;

/**
 * Options for creating an HLS video stream as a deck.gl BitmapLayer.
 */
export interface HlsDeckLayerOptions {
  id?: string;
  url: string;
  bounds?: DeckBounds;
  opacity?: number;
  hlsConfig?: Partial<Hls['config']>;
  onLoad?: (video: HTMLVideoElement) => void;
  onError?: (error: { type: string; details: string; fatal: boolean }) => void;
}

/**
 * Handle returned by {@link createHlsDeckLayer} with methods to control
 * the video stream and deck.gl layer lifecycle.
 */
export interface HlsDeckLayerHandle {
  destroy: () => void;
  getVideo: () => HTMLVideoElement | null;
  setUrl: (url: string) => void;
  getLayer: () => BitmapLayer;
  startAnimation: (onUpdate: (layer: BitmapLayer) => void) => void;
  stopAnimation: () => void;
}

/**
 * Convert Coordinates [TL, TR, BR, BL] to deck.gl's expected corner order [BL, BR, TR, TL].
 *
 * @param bounds Bounds in either simple or Coordinates format.
 * @returns Bounds ready to pass to BitmapLayer.
 */
function toBitmapBounds(bounds: DeckBounds): DeckBounds {
  if (Array.isArray(bounds[0])) {
    const c = bounds as Coordinates;
    return [c[3], c[2], c[1], c[0]] as Coordinates;
  }
  return bounds;
}

/**
 * Create an HLS video stream as a deck.gl BitmapLayer.
 *
 * Works for both 2D (`MapView`) and 3D (`GlobeView`) deck.gl contexts. The returned
 * handle exposes `startAnimation` to drive frame-by-frame re-renders, which must
 * be called to make the video visible and animate in the deck.gl canvas.
 *
 * Unlike the Mapbox and MapLibre adapters, this function creates its own
 * `<video>` element rather than relying on a map source. This makes it
 * usable in standalone deck.gl setups without any base map library.
 *
 * @param options Configuration for the video layer. See {@link HlsDeckLayerOptions}.
 * @returns A handle with methods to control the video layer and animation loop.
 *
 * @example
 * ```ts
 * import { Deck } from '@deck.gl/core';
 * import { createHlsDeckLayer } from 'hls-streaming-layer/deckgl';
 *
 * const deck = new Deck({ initialViewState: { longitude: 0, latitude: 0, zoom: 1 } });
 *
 * const handle = createHlsDeckLayer({
 *   url: 'https://example.com/stream/playlist.m3u8',
 *   bounds: [-180, -85, 180, 85],
 *   opacity: 0.8,
 *   onLoad: () => {
 *     handle.startAnimation((layer) => {
 *       deck.setProps({ layers: [layer] });
 *     });
 *   },
 * });
 *
 * handle.destroy();
 * ```
 */
export function createHlsDeckLayer(options: HlsDeckLayerOptions): HlsDeckLayerHandle {
  const {
    id = 'hls-deck',
    url,
    bounds = WORLD_BOUNDS_DECK,
    opacity = 0.75,
    hlsConfig,
    onLoad,
    onError,
  } = options;

  let hls: Hls | null = null;
  let rafId: number | null = null;
  let frame = 0;
  let destroyed = false;

  const videoEl = document.createElement('video');
  videoEl.crossOrigin = 'anonymous';

  const parsedBounds = toBitmapBounds(bounds);

  hls = attachHlsToVideo(videoEl, url, { hlsConfig, onLoad, onError });

  /**
   * Build a fresh BitmapLayer with the current video frame.
   * The `updateTriggers.image` counter tells deck.gl to re-upload
   * the texture from the video element on every render pass.
   */
  function makeLayer(): BitmapLayer {
    return new BitmapLayer({
      id: `${id}-bitmap`,
      bounds: parsedBounds as [number, number, number, number],
      image: videoEl,
      opacity,
      updateTriggers: { image: frame },
    });
  }

  return {
    /**
     * Stop the animation loop, destroy the HLS instance, and remove the video element.
     */
    destroy() {
      destroyed = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (hls) {
        hls.destroy();
        hls = null;
      }
    },

    /**
     * Returns the underlying HTML video element.
     */
    getVideo() {
      return videoEl;
    },

    /**
     * Switch to a different HLS stream URL, reusing the same video element.
     *
     * @param newUrl The new .m3u8 playlist URL.
     */
    setUrl(newUrl: string) {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      hls = attachHlsToVideo(videoEl, newUrl, { hlsConfig, onLoad, onError });
    },

    /**
     * Returns the current BitmapLayer for use in deck.gl's layers prop.
     * For a static snapshot; use `startAnimation` for live video.
     */
    getLayer() {
      return makeLayer();
    },

    /**
     * Start a `requestAnimationFrame` loop that calls `onUpdate` with a
     * freshly created BitmapLayer on every frame. Pass the received layer to
     * `deck.setProps({ layers: [layer] })` (or equivalent) to animate the video.
     * Safe to call multiple times — subsequent calls before `stopAnimation` are no-ops.
     *
     * @param onUpdate Called each frame with the latest BitmapLayer instance.
     */
    startAnimation(onUpdate: (layer: BitmapLayer) => void) {
      if (rafId !== null) return;
      function tick() {
        if (destroyed) return;
        if (videoEl.videoWidth > 0) {
          frame++;
          onUpdate(makeLayer());
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    },

    /**
     * Stop the animation loop started by `startAnimation`.
     */
    stopAnimation() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
