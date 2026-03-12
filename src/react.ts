import { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore — react-map-gl/mapbox may not have type declarations
import { useMap } from 'react-map-gl/mapbox';
import { addHlsLayer } from './core';
import type { HlsStreamingLayerOptions, HlsStreamingLayerHandle } from './types';

/**
 * Options accepted by the {@link useHlsLayer} hook.
 * Same as {@link HlsStreamingLayerOptions} but without the callback props,
 * since those are handled through the returned state instead.
 */
type UseHlsLayerOptions = Omit<HlsStreamingLayerOptions, 'onLoad' | 'onError'>;

/**
 * The return value of the {@link useHlsLayer} hook.
 */
interface UseHlsLayerResult {
  /**
   * True once the HLS manifest has been parsed and the video
   * has started playing on the map.
   */
  isLoaded: boolean;

  /**
   * Set when a fatal HLS error occurs. Contains the error type
   * and a human readable details message. Null when there is no error.
   */
  error: { type: string; details: string } | null;

  /**
   * The HTML video element created internally by Mapbox.
   * Null until the layer has finished initializing.
   */
  video: HTMLVideoElement | null;

  /**
   * Switch to a different HLS stream URL without unmounting and
   * remounting the layer. The video element stays the same.
   *
   * @param url The new .m3u8 playlist URL.
   */
  setUrl: (url: string) => void;
}

/**
 * React hook that adds an HLS video layer to a react-map-gl map.
 *
 * This must be used inside a `<Map>` component from react-map-gl so that
 * the `useMap` context is available. The layer is automatically cleaned up
 * when the component unmounts or when the `id` or `url` options change.
 *
 * @param options Configuration for the video layer.
 * @returns An object with loading state, error state, the video element, and a setUrl function.
 *
 * @example
 * ```tsx
 * import { useHlsLayer } from 'hls-streaming-layer/react';
 *
 * function VideoOverlay() {
 *   const { isLoaded, error } = useHlsLayer({
 *     url: 'https://example.com/stream/playlist.m3u8',
 *     paint: { 'raster-opacity': 0.7 },
 *   });
 *
 *   if (error) return <div>Error: {error.details}</div>;
 *   if (!isLoaded) return <div>Loading stream...</div>;
 *   return null;
 * }
 * ```
 */
export function useHlsLayer(options: UseHlsLayerOptions): UseHlsLayerResult {
  const { current: mapRef } = useMap();
  const handleRef = useRef<HlsStreamingLayerHandle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<{ type: string; details: string } | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  /**
   * Stable function to swap the stream URL.
   * Delegates to the underlying handle so there is no need to
   * tear down and recreate the layer.
   */
  const setUrl = useCallback((url: string) => {
    handleRef.current?.setUrl(url);
  }, []);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();

    // Reset state when the effect re runs due to option changes.
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
    // Only re mount when the id or url changes. Other paint/config changes
    // do not require tearing down and recreating the layer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, options.id, options.url]);

  return { isLoaded, error, video, setUrl };
}
