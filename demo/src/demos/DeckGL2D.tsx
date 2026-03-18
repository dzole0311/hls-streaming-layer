import React from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { useHlsDeckLayer } from 'hls-streaming-layer/react-deckgl';
import { WORLD_BOUNDS_DECK } from 'hls-streaming-layer/deckgl';
import type { DemoProps } from '../App';

/**
 * deck.gl 2D demo (MapView) with an HLS BitmapLayer.
 */
export default function DeckGL2D({ hlsUrl }: DemoProps) {
  const { layer, error } = useHlsDeckLayer({
    id: 'hls-2d',
    url: hlsUrl,
    bounds: WORLD_BOUNDS_DECK,
    opacity: 0.85,
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <DeckGL
        views={new MapView({ repeat: true })}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
        controller
        layers={layer ? [layer] : []}
        style={{ background: '#1a2744' }}
      />
      {error && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, background: '#b91c1c', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
          {error.details}
        </div>
      )}
    </div>
  );
}
