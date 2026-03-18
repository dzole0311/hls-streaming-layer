import React, { useState } from 'react';
import Map from 'react-map-gl/mapbox';
import { useHlsLayer } from 'hls-streaming-layer/react';

const STREAM_A = 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/stream-a/playlist.m3u8';
const STREAM_B = 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/stream-b/playlist.m3u8';

/**
 * Inner component that must render inside `<Map>` so `useHlsLayer` has access
 * to the react-map-gl context.
 */
function VideoOverlay() {
  const [activeUrl, setActiveUrl] = useState(STREAM_A);

  const { isLoaded, error, setUrl } = useHlsLayer({
    id: 'hls-overlay',
    url: activeUrl,
    paint: { 'raster-opacity': 0.8, 'raster-fade-duration': 0 },
  });

  const swap = () => {
    const next = activeUrl === STREAM_A ? STREAM_B : STREAM_A;
    setActiveUrl(next);
    setUrl(next);
  };

  return (
    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
      {error && <p style={{ color: 'red' }}>Error: {error.details}</p>}
      {!isLoaded && !error && <p>Loading stream…</p>}
      <button onClick={swap}>Swap stream</button>
    </div>
  );
}

/**
 * Full Mapbox + React example showing a streaming HLS layer with a stream-swap button.
 */
export default function App() {
  return (
    <Map
      mapboxAccessToken="YOUR_MAPBOX_TOKEN"
      initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="mapbox://styles/mapbox/satellite-v9"
    >
      <VideoOverlay />
    </Map>
  );
}
