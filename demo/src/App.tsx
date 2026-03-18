import React, { lazy, Suspense, useState } from 'react';

const MapboxFlat = lazy(() => import('./demos/MapboxFlat'));
const MapboxGlobe = lazy(() => import('./demos/MapboxGlobe'));
const MaplibreFlat = lazy(() => import('./demos/MaplibreFlat'));
const MaplibreGlobe = lazy(() => import('./demos/MaplibreGlobe'));
const DeckGL2D = lazy(() => import('./demos/DeckGL2D'));
const DeckGL3D = lazy(() => import('./demos/DeckGL3D'));

const TABS = [
  { id: 'mapbox-2d',       label: 'Mapbox 2D',       needsToken: true  },
  { id: 'mapbox-globe',    label: 'Mapbox Globe',    needsToken: true  },
  { id: 'maplibre-2d',     label: 'MapLibre 2D',     needsToken: false },
  { id: 'maplibre-globe',  label: 'MapLibre 3D',     needsToken: false },
  { id: 'deckgl-2d',       label: 'deck.gl 2D',      needsToken: false },
  { id: 'deckgl-globe',    label: 'deck.gl Globe',   needsToken: false },
] as const;

type TabId = typeof TABS[number]['id'];

const s: Record<string, React.CSSProperties> = {
  root:    { display: 'flex', flexDirection: 'column', height: '100vh' },
  header:  { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#161b22', borderBottom: '1px solid #30363d', flexShrink: 0 },
  title:   { fontWeight: 700, fontSize: 14, color: '#e6edf3', whiteSpace: 'nowrap', marginRight: 4 },
  input:   { flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '5px 10px', color: '#e6edf3', fontSize: 13, outline: 'none', minWidth: 0 },
  tabs:    { display: 'flex', gap: 2, padding: '0 16px', background: '#0d1117', borderBottom: '1px solid #30363d', flexShrink: 0 },
  tab:     { padding: '8px 14px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'transparent', color: '#8b949e', borderBottom: '2px solid transparent', transition: 'color .15s' },
  tabActive: { color: '#e6edf3', borderBottom: '2px solid #1f6feb' },
  content: { flex: 1, position: 'relative', overflow: 'hidden' },
  empty:   { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e', fontSize: 14 },
};

export interface DemoProps {
  hlsUrl: string;
  mapboxToken: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('mapbox-2d');
  const [hlsUrl, setHlsUrl] = useState(import.meta.env.VITE_HLS_URL ?? '');
  const [mapboxToken, setMapboxToken] = useState(import.meta.env.VITE_MAPBOX_TOKEN ?? '');

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const missingToken = currentTab.needsToken && !mapboxToken;
  const missingUrl = !hlsUrl;

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>hls-streaming-layer</span>
        <input
          style={s.input}
          placeholder="HLS stream URL (.m3u8)"
          value={hlsUrl}
          onChange={(e) => setHlsUrl(e.target.value)}
        />
        <input
          style={{ ...s.input, maxWidth: 260 }}
          placeholder="Mapbox token (pk.xxx)"
          value={mapboxToken}
          onChange={(e) => setMapboxToken(e.target.value)}
        />
      </div>

      <div style={s.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={activeTab === tab.id ? { ...s.tab, ...s.tabActive } : s.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {missingUrl ? (
          <div style={s.empty}>Enter an HLS stream URL above to get started.</div>
        ) : missingToken ? (
          <div style={s.empty}>Enter a Mapbox access token above for this demo.</div>
        ) : (
          <Suspense fallback={<div style={s.empty}>Loading…</div>}>
            {activeTab === 'mapbox-2d'      && <MapboxFlat    hlsUrl={hlsUrl} mapboxToken={mapboxToken} />}
            {activeTab === 'mapbox-globe'   && <MapboxGlobe   hlsUrl={hlsUrl} mapboxToken={mapboxToken} />}
            {activeTab === 'maplibre-2d'    && <MaplibreFlat  hlsUrl={hlsUrl} mapboxToken={mapboxToken} />}
            {activeTab === 'maplibre-globe' && <MaplibreGlobe hlsUrl={hlsUrl} mapboxToken={mapboxToken} />}
            {activeTab === 'deckgl-2d'      && <DeckGL2D      hlsUrl={hlsUrl} mapboxToken={mapboxToken} />}
            {activeTab === 'deckgl-globe'   && <DeckGL3D      hlsUrl={hlsUrl} mapboxToken={mapboxToken} />}
          </Suspense>
        )}
      </div>
    </div>
  );
}
