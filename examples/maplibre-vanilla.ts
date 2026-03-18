import maplibregl from 'maplibre-gl';
import { addHlsLayerMapLibre } from 'hls-streaming-layer/maplibre';
import { WORLD_COORDINATES } from 'hls-streaming-layer';

/**
 * MapLibre GL vanilla example: stream an HLS feed as a full-world raster overlay.
 *
 * No access token is required — this uses the free MapLibre demo tile server.
 * Pressing `s` swaps to a second stream URL without tearing down the layer.
 */
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 20],
  zoom: 2,
});

map.on('load', () => {
  const layer = addHlsLayerMapLibre(map, {
    id: 'weather',
    url: 'https://my-bucket.s3.us-east-1.amazonaws.com/streams/weather/playlist.m3u8',
    coordinates: WORLD_COORDINATES,
    paint: {
      'raster-opacity': 0.75,
      'raster-fade-duration': 0,
    },
    onLoad: (video) => {
      console.log('HLS stream playing', video.videoWidth, 'x', video.videoHeight);
    },
    onError: (err) => {
      console.error('HLS error', err.details);
    },
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 's') {
      layer.setUrl('https://my-bucket.s3.us-east-1.amazonaws.com/streams/weather-alt/playlist.m3u8');
    }
    if (e.key === 'd') {
      layer.destroy();
    }
  });
});
