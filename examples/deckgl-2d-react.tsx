import React from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { useHlsDeckLayer, WORLD_BOUNDS_DECK } from 'hls-streaming-layer/react-deckgl';

/**
 * deck.gl 2D React example: stream HLS video as a BitmapLayer in a flat MapView.
 *
 * `useHlsDeckLayer` manages the video element, hls.js instance, and animation
 * loop internally. The returned `layer` updates every video frame; pass it
 * directly to `<DeckGL layers={...}>`.
 */
export default function App() {
  const { layer, isLoaded, error } = useHlsDeckLayer({
    id: 'hls-2d',
    url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/live/playlist.m3u8',
    bounds: WORLD_BOUNDS_DECK,
    opacity: 0.8,
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <DeckGL
        views={new MapView({ repeat: true })}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
        controller
        layers={layer ? [layer] : []}
      />
      <div style={{ position: 'absolute', top: 12, left: 12, pointerEvents: 'none' }}>
        {error && <p style={{ color: 'red' }}>Error: {error.details}</p>}
        {!isLoaded && !error && <p style={{ color: 'white' }}>Loading stream…</p>}
      </div>
    </div>
  );
}
