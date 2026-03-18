import { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore — react-map-gl/mapbox may not have type declarations
import { useMap } from 'react-map-gl/mapbox';
import { addHlsLayer } from './core';
import type { HlsStreamingLayerOptions, HlsStreamingLayerHandle } from './types';

/**
 * Options accepted by the {@link useHlsLayer} hook.
 * Same as {@link HlsStreamingLayerOptions} minus callback props,
 * which are surfaced through the returned state instead.
 */
export type UseHlsLayerOptions = Omit<HlsStreamingLayerOptions, 'onLoad' | 'onError'>;

/**
 * Return value of the {@link useHlsLayer} hook.
 */
export interface UseHlsLayerResult {
  isLoaded: boolean;
  error: { type: string; details: string } | null;
  video: HTMLVideoElement | null;
  setUrl: (url: string) => void;
}

/**
 * React hook that adds an HLS video layer to a react-map-gl Mapbox map.
 *
 * Must be used inside a `<Map>` component from `react-map-gl` so that the
 * `useMap` context is available. The layer is automatically cleaned up when
 * the component unmounts or when `id` or `url` changes.
 *
 * @param options Configuration for the video layer. See {@link UseHlsLayerOptions}.
 * @returns Loading state, error state, the video element, and a `setUrl` function.
 *
 * @example
 * ```tsx
 * import Map from 'react-map-gl/mapbox';
 * import { useHlsLayer } from 'hls-streaming-layer/react';
 *
 * function VideoOverlay() {
 *   const { isLoaded, error } = useHlsLayer({
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
 *     <Map mapboxAccessToken="pk.xxx" style={{ width: '100vw', height: '100vh' }}>
 *       <VideoOverlay />
 *     </Map>
 *   );
 * }
 * ```
 */
export function useHlsLayer(options: UseHlsLayerOptions): UseHlsLayerResult {
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

    const handle = addHlsLayer(map, {
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
