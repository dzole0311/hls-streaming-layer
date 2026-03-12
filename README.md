# hls-streaming-layer

Stream HLS video as a layer on Mapbox GL maps. Works on both 2D and globe projections.

## Install

```bash
npm install hls-streaming-layer hls.js mapbox-gl
```

## Usage

### Vanilla JS

```ts
import { addHlsLayer } from 'hls-streaming-layer';

const layer = addHlsLayer(map, {
  url: 'https://example.com/stream/playlist.m3u8',
  coordinates: [
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85],
  ],
  paint: { 'raster-opacity': 0.7 },
  onLoad: (video) => console.log('Playing', video.duration),
  onError: (err) => console.error(err.details),
});

// Swap stream without remounting
layer.setUrl('https://example.com/other/playlist.m3u8');

// Clean up
layer.destroy();
```

### React (`react-map-gl`)

```tsx
import Map from 'react-map-gl/mapbox';
import { useHlsLayer } from 'hls-streaming-layer/react';

function VideoOverlay() {
  const { isLoaded, error } = useHlsLayer({
    url: 'https://example.com/stream/playlist.m3u8',
    paint: { 'raster-opacity': 0.7 },
  });

  if (error) return <div>Error: {error.details}</div>;
  return null;
}

function App() {
  return (
    <Map mapboxAccessToken="..." style={{ width: '100%', height: '100vh' }}>
      <VideoOverlay />
    </Map>
  );
}
```

## API

### `addHlsLayer(map, options)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | **required** | HLS playlist URL (`.m3u8`) |
| `id` | `string` | `"hls-video"` | Unique ID prefix for the source and layer |
| `coordinates` | `Coordinates` | World extent | Four corners: TL, TR, BR, BL as `[lng, lat]` |
| `paint` | `RasterPaint` | `{ 'raster-opacity': 0.75 }` | Mapbox raster paint properties |
| `beforeId` | `string` | — | Insert layer before this layer ID |
| `hlsConfig` | `Partial<HlsConfig>` | — | [hls.js config](https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning) overrides |
| `onLoad` | `(video: HTMLVideoElement) => void` | — | Called when video starts playing |
| `onError` | `(error) => void` | — | Called on fatal errors |

Returns `HlsStreamingLayerHandle` with `destroy()`, `getVideo()`, and `setUrl()`.

### `useHlsLayer(options)` (React)

Same options as above (minus callbacks). Returns `{ isLoaded, error, video, setUrl }`.

## How it works

Mapbox GL's `video` source creates a `<video>` element internally but only accepts static URLs. This library:

1. Seeds the source with a tiny inline placeholder MP4
2. Grabs the `<video>` element from the source once Mapbox creates it
3. Attaches [hls.js](https://github.com/video-dev/hls.js) for adaptive HLS streaming
4. Falls back to native HLS on Safari

## License

MIT
