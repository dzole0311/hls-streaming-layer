import { Deck, MapView } from '@deck.gl/core';
import { createHlsDeckLayer, WORLD_BOUNDS_DECK } from 'hls-streaming-layer/deckgl';

/**
 * deck.gl 2D vanilla example: stream HLS video as a BitmapLayer in a flat MapView.
 *
 * `startAnimation` drives the render loop — it must be called inside `onLoad`
 * so deck.gl re-renders on every video frame. Pressing `s` swaps the stream URL.
 */
const deck = new Deck({
  canvas: 'deck-canvas',
  views: new MapView({ repeat: true }),
  initialViewState: {
    longitude: 0,
    latitude: 20,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  },
  controller: true,
  layers: [],
});

const handle = createHlsDeckLayer({
  id: 'hls-2d',
  url: 'https://example.com/stream/playlist.m3u8',
  bounds: WORLD_BOUNDS_DECK,
  opacity: 0.8,
  onLoad: (video) => {
    console.log('HLS 2D stream playing', video.videoWidth, 'x', video.videoHeight);

    handle.startAnimation((layer) => {
      deck.setProps({ layers: [layer] });
    });
  },
  onError: (err) => {
    console.error('HLS 2D error', err.details);
  },
});

document.addEventListener('keydown', (e) => {
  if (e.key === 's') {
    handle.setUrl('https://example.com/stream-alt/playlist.m3u8');
  }
  if (e.key === 'd') {
    handle.stopAnimation();
    handle.destroy();
    deck.setProps({ layers: [] });
  }
});
