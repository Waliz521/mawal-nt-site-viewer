export function zIndexForType(type) {
  const order = {
    fence: 1,
    cyan: 2,
    purple: 3,
    existing_solar: 4,
    proposed_solar: 5,
    bess: 6,
    generators: 7,
    storage: 8,
    tbc: 9,
    other: 0,
  };
  return order[type] ?? 0;
}

export function styleForLayerType(layerType, colorHex = '#999999') {
  return {
    color: colorHex,
    weight: layerType === 'fence' ? 2.5 : 2,
    fillColor: colorHex,
    fillOpacity: layerType === 'fence' ? 0.08 : 0.35,
    opacity: 0.9,
  };
}

export function buildFeatureCollection(layers, visibleLayerIds) {
  const features = layers
    .filter((layer) => visibleLayerIds.has(layer.id))
    .sort((a, b) => zIndexForType(a.layer_type) - zIndexForType(b.layer_type))
    .map((layer) => {
      const feature = layer.geometry_geojson;
      return {
        type: 'Feature',
        geometry: feature.geometry ?? feature,
        properties: {
          ...(feature.properties ?? {}),
          _layerId: layer.id,
          _layerType: layer.layer_type,
          _layerName: layer.layer_name,
          _color: layer.color_hex,
          _areaM2: layer.area_m2,
          _siteName: layer.sites?.name ?? '',
          _siteSlug: layer.sites?.slug ?? '',
        },
      };
    });

  return { type: 'FeatureCollection', features };
}
