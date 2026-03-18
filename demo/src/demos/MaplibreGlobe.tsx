import React from 'react';
import Map from 'react-map-gl/maplibre';
import { useHlsLayerMapLibre } from 'hls-streaming-layer/react-maplibre';
import type { DemoProps } from '../App';

function HlsOverlay({ hlsUrl }: { hlsUrl: string }) {
  const { error } = useHlsLayerMapLibre({
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
 * MapLibre GL perspective demo with an HLS raster overlay.
 */
export default function MaplibreGlobe({ hlsUrl }: DemoProps) {
  return (
    <Map
      initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5, pitch: 45, bearing: -10 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://demotiles.maplibre.org/style.json"
    >
      <HlsOverlay hlsUrl={hlsUrl} />
    </Map>
  );
}
