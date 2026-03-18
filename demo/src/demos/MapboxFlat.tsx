import React from 'react';
import Map from 'react-map-gl/mapbox';
import { useHlsLayer } from 'hls-streaming-layer/react';
import type { DemoProps } from '../App';

function HlsOverlay({ hlsUrl }: { hlsUrl: string }) {
  const { error } = useHlsLayer({
    url: hlsUrl,
    paint: { 'raster-opacity': 0.8, 'raster-fade-duration': 0 },
  });

  if (error) {
    return (
      <div style={{ position: 'absolute', bottom: 12, left: 12, background: '#b91c1c', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
        {error.details}
      </div>
    );
  }

  return null;
}

/**
 * Mapbox GL 2D demo with an HLS raster overlay.
 */
export default function MapboxFlat({ hlsUrl, mapboxToken }: DemoProps) {
  return (
    <Map
      mapboxAccessToken={mapboxToken}
      initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/satellite-v9"
    >
      <HlsOverlay hlsUrl={hlsUrl} />
    </Map>
  );
}
