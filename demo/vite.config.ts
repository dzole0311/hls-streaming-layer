import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'react-map-gl/mapbox',   replacement: path.resolve(__dirname, '../node_modules/react-map-gl/dist/mapbox.js') },
      { find: 'react-map-gl/maplibre', replacement: path.resolve(__dirname, '../node_modules/react-map-gl/dist/maplibre.js') },
      { find: 'hls-streaming-layer/react-maplibre', replacement: path.resolve(__dirname, '../src/react-maplibre.ts') },
      { find: 'hls-streaming-layer/react-deckgl',   replacement: path.resolve(__dirname, '../src/react-deckgl.ts') },
      { find: 'hls-streaming-layer/react',          replacement: path.resolve(__dirname, '../src/react.ts') },
      { find: 'hls-streaming-layer/maplibre',       replacement: path.resolve(__dirname, '../src/maplibre.ts') },
      { find: 'hls-streaming-layer/deckgl',         replacement: path.resolve(__dirname, '../src/deckgl.ts') },
      { find: 'hls-streaming-layer',                replacement: path.resolve(__dirname, '../src/index.ts') },
    ],
  },
});
