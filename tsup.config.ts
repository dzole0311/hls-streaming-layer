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
    entry: { react: 'src/react.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['mapbox-gl', 'hls.js', 'react', 'react-map-gl', 'react-map-gl/mapbox'],
  },
]);
