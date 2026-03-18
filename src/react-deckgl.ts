import { useEffect, useRef, useState, useCallback } from 'react';
import { BitmapLayer } from '@deck.gl/layers';
import { createHlsDeckLayer } from './deckgl';
import type { HlsDeckLayerOptions, HlsDeckLayerHandle } from './deckgl';

/**
 * Options accepted by the {@link useHlsDeckLayer} hook.
 * Same as {@link HlsDeckLayerOptions} minus callback props,
 * which are surfaced through the returned state instead.
 */
export type UseHlsDeckLayerOptions = Omit<HlsDeckLayerOptions, 'onLoad' | 'onError'>;

/**
 * Return value of the {@link useHlsDeckLayer} hook.
 */
export interface UseHlsDeckLayerResult {
  layer: BitmapLayer | null;
  isLoaded: boolean;
  error: { type: string; details: string } | null;
  video: HTMLVideoElement | null;
  setUrl: (url: string) => void;
}

/**
 * React hook that streams HLS video into a deck.gl BitmapLayer.
 *
 * Works for both 2D (`MapView`) and 3D (`GlobeView`) deck.gl contexts.
 * After the stream loads, the hook drives an internal `requestAnimationFrame`
 * loop that updates `layer` on every frame so the video animates in the
 * deck.gl canvas. Pass `layer` directly to the `layers` prop of `<DeckGL>`.
 *
 * @param options Configuration for the video layer. See {@link UseHlsDeckLayerOptions}.
 * @returns The current BitmapLayer, loading state, error state, video element, and `setUrl`.
 *
 * @example
 * ```tsx
 * import DeckGL from '@deck.gl/react';
 * import { MapView } from '@deck.gl/core';
 * import { useHlsDeckLayer } from 'hls-streaming-layer/react-deckgl';
 *
 * function App() {
 *   const { layer, isLoaded } = useHlsDeckLayer({
 *     url: 'https://example.com/stream/playlist.m3u8',
 *     bounds: [-180, -85, 180, 85],
 *     opacity: 0.8,
 *   });
 *
 *   return (
 *     <DeckGL
 *       views={new MapView()}
 *       initialViewState={{ longitude: 0, latitude: 0, zoom: 1 }}
 *       layers={layer ? [layer] : []}
 *     />
 *   );
 * }
 * ```
 */
export function useHlsDeckLayer(options: UseHlsDeckLayerOptions): UseHlsDeckLayerResult {
  const handleRef = useRef<HlsDeckLayerHandle | null>(null);
  const [layer, setLayer] = useState<BitmapLayer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<{ type: string; details: string } | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const setUrl = useCallback((url: string) => {
    handleRef.current?.setUrl(url);
  }, []);

  useEffect(() => {
    setLayer(null);
    setIsLoaded(false);
    setError(null);
    setVideo(null);

    const handle = createHlsDeckLayer({
      ...options,
      onLoad(videoEl) {
        setIsLoaded(true);
        setVideo(videoEl);
        handle.startAnimation((l) => setLayer(l));
      },
      onError(err) {
        setError({ type: err.type, details: err.details });
      },
    });

    handleRef.current = handle;

    return () => {
      handle.stopAnimation();
      handle.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.id, options.url]);

  return { layer, isLoaded, error, video, setUrl };
}
