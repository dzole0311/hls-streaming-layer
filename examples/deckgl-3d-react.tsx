import React from 'react';
import DeckGL from '@deck.gl/react';
import { GlobeView } from '@deck.gl/core';
import { useHlsDeckLayer, WORLD_BOUNDS_DECK } from 'hls-streaming-layer/react-deckgl';

/**
 * deck.gl 3D globe React example: stream HLS video as a BitmapLayer draped
 * over a 3D globe using GlobeView.
 *
 * The only difference from the 2D React example is passing `new GlobeView()`
 * to `<DeckGL views={...}>`. The hook and layer API are identical.
 */
export default function App() {
  const { layer, isLoaded, error } = useHlsDeckLayer({
    id: 'hls-3d',
    url: 'https://example.com/stream/playlist.m3u8',
    bounds: WORLD_BOUNDS_DECK,
    opacity: 0.85,
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <DeckGL
        views={new GlobeView({ id: 'globe', resolution: 5 })}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 0 }}
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
