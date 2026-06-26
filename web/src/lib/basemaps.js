/** Free basemap tile layers (no API key required). */

/** Esri satellite has no tiles above ~z17 in remote NT — upscale instead of "Map data not yet available". */
export const SATELLITE_MAX_NATIVE_ZOOM = 17;
export const MAP_MAX_ZOOM = 18;

export const BASEMAPS = {
  satellite: {
    id: 'satellite',
    label: 'Satellite + labels',
    attribution:
      'Imagery © Esri, Maxar, Earthstar Geographics | Labels © Esri | KML © Mawal',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: MAP_MAX_ZOOM,
        maxNativeZoom: SATELLITE_MAX_NATIVE_ZOOM,
        opacity: 1,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        maxZoom: MAP_MAX_ZOOM,
        maxNativeZoom: SATELLITE_MAX_NATIVE_ZOOM,
        opacity: 1,
      },
    ],
  },
  osm: {
    id: 'osm',
    label: 'Street map',
    attribution: '&copy; OpenStreetMap contributors',
    layers: [
      {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxZoom: 19,
        opacity: 1,
        subdomains: 'abc',
      },
    ],
  },
};

export const DEFAULT_BASEMAP = 'satellite';
