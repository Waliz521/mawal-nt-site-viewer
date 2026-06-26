/** Convert GeoJSON Feature geometry to Google Maps LatLngLiteral path arrays. */
export function geoJsonToPaths(geometry) {
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    return [ringToLatLng(geometry.coordinates[0])];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly) => ringToLatLng(poly[0]));
  }

  return [];
}

function ringToLatLng(ring) {
  return ring.map(([lng, lat]) => ({ lat, lng }));
}

export function getFeatureGeometry(featureOrGeometry) {
  if (!featureOrGeometry) return null;
  if (featureOrGeometry.type === 'Feature') {
    return featureOrGeometry.geometry ?? null;
  }
  if (featureOrGeometry.type === 'Polygon' || featureOrGeometry.type === 'MultiPolygon') {
    return featureOrGeometry;
  }
  return null;
}

export function boundsFromFeature(feature) {
  const geometry = getFeatureGeometry(feature);
  if (!geometry) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const rings =
    geometry.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((p) => p[0]);

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  }

  if (!Number.isFinite(minLat)) return null;
  return { minLat, maxLat, minLng, maxLng };
}

export function boundsFromLayers(layers) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const layer of layers) {
    const geometry = getFeatureGeometry(layer.geometry_geojson);
    if (!geometry) continue;

    const rings =
      geometry.type === 'Polygon'
        ? [geometry.coordinates[0]]
        : geometry.coordinates.map((p) => p[0]);

    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    }
  }

  if (!Number.isFinite(minLat)) return null;
  return { minLat, maxLat, minLng, maxLng };
}
