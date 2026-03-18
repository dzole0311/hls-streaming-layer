import { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore — react-map-gl/maplibre may not have type declarations
import { useMap } from 'react-map-gl/maplibre';
import { addHlsLayerMapLibre } from './maplibre';
import type { HlsStreamingLayerHandle } from './types';
import type { HlsStreamingLayerMapLibreOptions } from './maplibre';

/**
 * Options accepted by the {@link useHlsLayerMapLibre} hook.
 * Same as {@link HlsStreamingLayerMapLibreOptions} minus callback props,
 * which are surfaced through the returned state instead.
 */
export type UseHlsLayerMapLibreOptions = Omit<
  HlsStreamingLayerMapLibreOptions,
  'onLoad' | 'onError'
>;

/**
 * Return value of the {@link useHlsLayerMapLibre} hook.
 */
export interface UseHlsLayerMapLibreResult {
  isLoaded: boolean;
  error: { type: string; details: string } | null;
  video: HTMLVideoElement | null;
  setUrl: (url: string) => void;
}

/**
 * React hook that adds an HLS video layer to a react-map-gl MapLibre map.
 *
 * Must be used inside a `<Map>` component from `react-map-gl` (configured with
 * MapLibre) so that the `useMap` context is available. The layer is automatically
 * cleaned up when the component unmounts or when `id` or `url` changes.
 *
 * @param options Configuration for the video layer. See {@link UseHlsLayerMapLibreOptions}.
 * @returns Loading state, error state, the video element, and a `setUrl` function.
 *
 * @example
 * ```tsx
 * import Map from 'react-map-gl/maplibre';
 * import { useHlsLayerMapLibre } from 'hls-streaming-layer/react-maplibre';
 *
 * function VideoOverlay() {
 *   const { isLoaded, error } = useHlsLayerMapLibre({
 *     url: 'https://example.com/stream/playlist.m3u8',
 *     paint: { 'raster-opacity': 0.7 },
 *   });
 *   if (error) return <div>Error: {error.details}</div>;
 *   if (!isLoaded) return <div>Loading stream...</div>;
 *   return null;
 * }
 *
 * function App() {
 *   return (
 *     <Map mapStyle="https://demotiles.maplibre.org/style.json" style={{ width: '100vw', height: '100vh' }}>
 *       <VideoOverlay />
 *     </Map>
 *   );
 * }
 * ```
 */
export function useHlsLayerMapLibre(
  options: UseHlsLayerMapLibreOptions,
): UseHlsLayerMapLibreResult {
  const { current: mapRef } = useMap();
  const handleRef = useRef<HlsStreamingLayerHandle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<{ type: string; details: string } | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const setUrl = useCallback((url: string) => {
    handleRef.current?.setUrl(url);
  }, []);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();

    setIsLoaded(false);
    setError(null);
    setVideo(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = addHlsLayerMapLibre(map as any, {
      ...options,
      onLoad(videoEl) {
        setIsLoaded(true);
        setVideo(videoEl);
      },
      onError(err) {
        setError({ type: err.type, details: err.details });
      },
    });

    handleRef.current = handle;

    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, options.id, options.url]);

  return { isLoaded, error, video, setUrl };
}
