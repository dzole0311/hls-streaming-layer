import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['mapbox-gl', 'hls.js'],
  },
  {
    entry: { maplibre: 'src/maplibre.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['maplibre-gl', 'hls.js'],
  },
  {
    entry: { deckgl: 'src/deckgl.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['@deck.gl/core', '@deck.gl/layers', 'hls.js'],
  },
  {
    entry: { react: 'src/react.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['mapbox-gl', 'hls.js', 'react', 'react-map-gl', 'react-map-gl/mapbox'],
  },
  {
    entry: { 'react-maplibre': 'src/react-maplibre.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['maplibre-gl', 'hls.js', 'react', 'react-map-gl', 'react-map-gl/maplibre'],
  },
  {
    entry: { 'react-deckgl': 'src/react-deckgl.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['@deck.gl/core', '@deck.gl/layers', 'hls.js', 'react'],
  },
]);
