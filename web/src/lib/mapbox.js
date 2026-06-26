/** Mapbox basemap config for Leaflet (512px tiles). */

export const MAPBOX_STYLE = 'mapbox/satellite-streets-v12';

export function getMapboxToken() {
  return import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';
}

export function getMapboxTileUrl(token = getMapboxToken()) {
  return `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${token}`;
}

/** Northern Territory, Australia */
export const NT_BOUNDS = [
  [-26.0, 129.0],
  [-10.5, 138.2],
];

export const NT_CENTER = [-19.2, 133.8];
export const NT_ZOOM = 6;
