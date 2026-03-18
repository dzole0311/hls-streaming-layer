import mapboxgl from 'mapbox-gl';
import { addHlsLayer, WORLD_COORDINATES } from 'hls-streaming-layer';

mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

/**
 * Basic Mapbox GL example: stream an HLS feed as a full-world raster overlay.
 *
 * The layer is added once the map style finishes loading. Pressing `s` on the
 * keyboard swaps to a second stream URL without tearing down the layer.
 */
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [0, 20],
  zoom: 2,
});

map.on('load', () => {
  const layer = addHlsLayer(map, {
    id: 'weather',
    url: 'https://example.com/weather/playlist.m3u8',
    coordinates: WORLD_COORDINATES,
    paint: {
      'raster-opacity': 0.75,
      'raster-fade-duration': 0,
    },
    beforeId: 'waterway-label',
    onLoad: (video) => {
      console.log('HLS stream playing', video.videoWidth, 'x', video.videoHeight);
    },
    onError: (err) => {
      console.error('HLS error', err.details);
    },
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 's') {
      layer.setUrl('https://example.com/weather-alt/playlist.m3u8');
    }
    if (e.key === 'd') {
      layer.destroy();
    }
  });
});
