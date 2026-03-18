import { Deck, GlobeView } from '@deck.gl/core';
import { createHlsDeckLayer, WORLD_BOUNDS_DECK } from 'hls-streaming-layer/deckgl';

/**
 * deck.gl 3D globe vanilla example: stream HLS video as a BitmapLayer draped
 * over a 3D globe using GlobeView.
 *
 * The only difference from the 2D example is `views: new GlobeView()`.
 * The same `createHlsDeckLayer` API and BitmapLayer work in both views.
 * Pressing `s` swaps the stream URL without restarting the animation loop.
 */
const deck = new Deck({
  canvas: 'deck-canvas',
  views: new GlobeView({ id: 'globe', resolution: 5 }),
  initialViewState: {
    longitude: 0,
    latitude: 20,
    zoom: 0,
  },
  controller: true,
  layers: [],
});

const handle = createHlsDeckLayer({
  id: 'hls-3d',
  url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/live/playlist.m3u8',
  bounds: WORLD_BOUNDS_DECK,
  opacity: 0.85,
  onLoad: (video) => {
    console.log('HLS 3D globe stream playing', video.videoWidth, 'x', video.videoHeight);

    handle.startAnimation((layer) => {
      deck.setProps({ layers: [layer] });
    });
  },
  onError: (err) => {
    console.error('HLS 3D error', err.details);
  },
});

document.addEventListener('keydown', (e) => {
  if (e.key === 's') {
    handle.setUrl('https://my-bucket.s3.us-east-1.amazonaws.com/streams/live-alt/playlist.m3u8');
  }
  if (e.key === 'd') {
    handle.stopAnimation();
    handle.destroy();
    deck.setProps({ layers: [] });
  }
});
