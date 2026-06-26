import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, LayerGroup, useMap } from 'react-leaflet';
import { boundsFromLayers } from '../lib/geojson';
import { BASEMAPS, DEFAULT_BASEMAP, MAP_MAX_ZOOM, SATELLITE_MAX_NATIVE_ZOOM } from '../lib/basemaps';
import 'leaflet/dist/leaflet.css';

function FitBounds({ site, layers }) {
  const map = useMap();
  const mapBounds = useMemo(() => boundsFromLayers(layers), [layers]);

  useEffect(() => {
    if (mapBounds) {
      map.fitBounds(
        [
          [mapBounds.minLat, mapBounds.minLng],
          [mapBounds.maxLat, mapBounds.maxLng],
        ],
        { padding: [40, 40], maxZoom: SATELLITE_MAX_NATIVE_ZOOM },
      );
      return;
    }

    if (site.lat != null && site.lng != null) {
      map.setView([site.lat, site.lng], SATELLITE_MAX_NATIVE_ZOOM);
    }
  }, [map, mapBounds, site.lat, site.lng]);

  return null;
}

function BasemapTileLayer({ layer, attribution }) {
  const options = {
    url: layer.url,
    attribution,
    maxZoom: layer.maxZoom ?? 19,
    opacity: layer.opacity ?? 1,
  };

  if (layer.subdomains) {
    options.subdomains = layer.subdomains;
  }

  if (layer.maxNativeZoom != null) {
    options.maxNativeZoom = layer.maxNativeZoom;
  }

  return <TileLayer {...options} />;
}

function BasemapLayers() {
  return (
    <LayersControl position="topright">
      {Object.values(BASEMAPS).map((basemap) => (
        <LayersControl.BaseLayer
          key={basemap.id}
          checked={basemap.id === DEFAULT_BASEMAP}
          name={basemap.label}
        >
          {basemap.layers.length === 1 ? (
            <BasemapTileLayer layer={basemap.layers[0]} attribution={basemap.attribution} />
          ) : (
            <LayerGroup>
              {basemap.layers.map((layer, index) => (
                <BasemapTileLayer
                  key={`${basemap.id}-${index}`}
                  layer={layer}
                  attribution={index === basemap.layers.length - 1 ? basemap.attribution : ''}
                />
              ))}
            </LayerGroup>
          )}
        </LayersControl.BaseLayer>
      ))}
    </LayersControl>
  );
}

function zIndexForType(type) {
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

function styleForLayer(layer) {
  const color = layer.color_hex ?? '#999999';
  return {
    color,
    weight: layer.layer_type === 'fence' ? 2.5 : 2,
    fillColor: color,
    fillOpacity: layer.layer_type === 'fence' ? 0.08 : 0.35,
    opacity: 0.9,
  };
}

export default function SiteMap({ site, layers, visibleTypes }) {
  const visibleLayers = useMemo(() => {
    return layers
      .filter((l) => visibleTypes.has(l.layer_type))
      .sort((a, b) => zIndexForType(a.layer_type) - zIndexForType(b.layer_type));
  }, [layers, visibleTypes]);

  const center = useMemo(() => {
    if (site.lat != null && site.lng != null) {
      return [site.lat, site.lng];
    }
    return [-22.65, 133.0];
  }, [site.lat, site.lng]);

  return (
    <MapContainer
      center={center}
      zoom={SATELLITE_MAX_NATIVE_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      className="leaflet-map"
      scrollWheelZoom
      zoomControl
    >
      <BasemapLayers />
      <FitBounds site={site} layers={layers} />

      {visibleLayers.map((layer) => (
        <GeoJSON
          key={layer.id}
          data={layer.geometry_geojson}
          style={() => styleForLayer(layer)}
          onEachFeature={(feature, leafletLayer) => {
            leafletLayer.bindPopup(
              `<strong>${escapeHtml(layer.layer_name)}</strong><br/>${Number(layer.area_m2).toLocaleString('en-AU', { maximumFractionDigits: 1 })} m²`,
            );
          }}
        />
      ))}
    </MapContainer>
  );
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
