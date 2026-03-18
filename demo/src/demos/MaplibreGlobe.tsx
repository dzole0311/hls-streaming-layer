import React, { useRef } from 'react';
import Map from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
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
 * MapLibre GL globe projection demo with an HLS raster overlay.
 * Requires MapLibre GL JS v5+.
 */
export default function MaplibreGlobe({ hlsUrl }: DemoProps) {
  const mapRef = useRef<MapRef>(null);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      onLoad={() => {
        const map = mapRef.current?.getMap();
        if (!map) return;
        (map as any).setProjection({ type: 'globe' });
      }}
    >
      <HlsOverlay hlsUrl={hlsUrl} />
    </Map>
  );
}
