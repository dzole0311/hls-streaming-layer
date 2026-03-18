# hls-streaming-layer

Stream HLS video as a raster layer on Mapbox GL, MapLibre GL, and deck.gl maps — in 2D and globe projections.

## Install

```bash
npm install hls-streaming-layer hls.js
```

Install the peer dependency for whichever map library you use:

```bash
npm install mapbox-gl                        # Mapbox
npm install maplibre-gl                      # MapLibre
npm install @deck.gl/core @deck.gl/layers    # deck.gl
```

## Usage

### Mapbox GL

```ts
import { addHlsLayer } from 'hls-streaming-layer';

const layer = addHlsLayer(map, {
  url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/live/playlist.m3u8',
  paint: { 'raster-opacity': 0.8 },
  onLoad: (video) => console.log('playing', video.videoWidth),
  onError: (err) => console.error(err.details),
});

layer.setUrl('https://my-bucket.s3.us-east-1.amazonaws.com/streams/alt/playlist.m3u8');
layer.destroy();
```

### MapLibre GL

```ts
import { addHlsLayerMapLibre } from 'hls-streaming-layer/maplibre';

const layer = addHlsLayerMapLibre(map, {
  url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/live/playlist.m3u8',
  paint: { 'raster-opacity': 0.8 },
});
```

### deck.gl (2D and 3D globe)

```ts
import { Deck, GlobeView } from '@deck.gl/core';
import { createHlsDeckLayer } from 'hls-streaming-layer/deckgl';

const deck = new Deck({ views: new GlobeView() });

const handle = createHlsDeckLayer({
  url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/live/playlist.m3u8',
  bounds: [-180, -85, 180, 85],
  onLoad: () => {
    handle.startAnimation((layer) => deck.setProps({ layers: [layer] }));
  },
});
```

### React — Mapbox

```tsx
import Map from 'react-map-gl/mapbox';
import { useHlsLayer } from 'hls-streaming-layer/react';

function VideoOverlay() {
  const { isLoaded, error } = useHlsLayer({
    url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/live/playlist.m3u8',
    paint: { 'raster-opacity': 0.8 },
  });
  if (error) return <div>{error.details}</div>;
  return null;
}

export default function App() {
  return (
    <Map mapboxAccessToken="pk.xxx" style={{ width: '100vw', height: '100vh' }}>
      <VideoOverlay />
    </Map>
  );
}
```

### React — MapLibre

```tsx
import Map from 'react-map-gl/maplibre';
import { useHlsLayerMapLibre } from 'hls-streaming-layer/react-maplibre';
```

Same hook API as `useHlsLayer`, used inside a `react-map-gl/maplibre` `<Map>`.

### React — deck.gl

```tsx
import DeckGL from '@deck.gl/react';
import { GlobeView } from '@deck.gl/core';
import { useHlsDeckLayer } from 'hls-streaming-layer/react-deckgl';

export default function App() {
  const { layer } = useHlsDeckLayer({
    url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/live/playlist.m3u8',
    bounds: [-180, -85, 180, 85],
  });

  return (
    <DeckGL
      views={new GlobeView()}
      initialViewState={{ longitude: 0, latitude: 0, zoom: 0 }}
      layers={layer ? [layer] : []}
    />
  );
}
```

## Demo

```bash
cp demo/.env.example demo/.env
# edit demo/.env — set VITE_MAPBOX_TOKEN and VITE_HLS_URL
npm install
npm run demo
```

Opens a local dev server with all six demos switchable via tabs:
Mapbox 2D, Mapbox Globe, MapLibre 2D, MapLibre Globe, deck.gl 2D, deck.gl Globe.

## API

### `addHlsLayer(map, options)` / `addHlsLayerMapLibre(map, options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | **required** | HLS playlist URL (`.m3u8`) |
| `id` | `string` | `"hls-video"` | Unique ID prefix for the source and layer |
| `coordinates` | `Coordinates` | World extent | Four corners TL→TR→BR→BL as `[lng, lat]` |
| `paint` | `RasterPaint` | `{ 'raster-opacity': 0.75 }` | Raster paint properties |
| `beforeId` | `string` | — | Insert layer below this layer ID |
| `hlsConfig` | `Partial<HlsConfig>` | — | hls.js config overrides |
| `onLoad` | `(video) => void` | — | Called when video starts playing |
| `onError` | `(error) => void` | — | Called on fatal errors |

Returns `HlsStreamingLayerHandle` → `destroy()`, `getVideo()`, `setUrl(url)`.

### `createHlsDeckLayer(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | **required** | HLS playlist URL |
| `id` | `string` | `"hls-deck"` | Layer ID prefix |
| `bounds` | `DeckBounds` | World extent | `[west, south, east, north]` or `Coordinates` |
| `opacity` | `number` | `0.75` | Layer opacity |
| `hlsConfig` | `Partial<HlsConfig>` | — | hls.js config overrides |
| `onLoad` | `(video) => void` | — | Called when video starts playing |
| `onError` | `(error) => void` | — | Called on fatal errors |

Returns `HlsDeckLayerHandle` → `destroy()`, `getVideo()`, `setUrl(url)`, `getLayer()`, `startAnimation(cb)`, `stopAnimation()`.

### React hooks

| Hook | Entry point | Map context required |
|---|---|---|
| `useHlsLayer` | `hls-streaming-layer/react` | `react-map-gl/mapbox` `<Map>` |
| `useHlsLayerMapLibre` | `hls-streaming-layer/react-maplibre` | `react-map-gl/maplibre` `<Map>` |
| `useHlsDeckLayer` | `hls-streaming-layer/react-deckgl` | none |

`useHlsLayer` and `useHlsLayerMapLibre` return `{ isLoaded, error, video, setUrl }`.
`useHlsDeckLayer` returns `{ layer, isLoaded, error, video, setUrl }`.

## How it works

Mapbox and MapLibre video sources require a URL at creation time. The library seeds the source with a minimal inline MP4, grabs the `<video>` element the map creates internally, then hands it to [hls.js](https://github.com/video-dev/hls.js) for adaptive streaming. Safari uses native HLS instead of hls.js.

For deck.gl, the library creates its own `<video>` element and drives a `requestAnimationFrame` loop that produces a new `BitmapLayer` each frame with updated `updateTriggers`, forcing deck.gl to re-upload the current video frame to GPU.

## License

MIT
