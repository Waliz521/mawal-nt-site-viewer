import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import MapBoundaryLayers, { IndigenousZoomBridge } from './MapBoundaryLayers';
import SiteZoomBridge from './SiteZoomBridge';
import {
  NT_BOUNDS,
  NT_CENTER,
  NT_ZOOM,
  getMapboxTileUrl,
  getMapboxToken,
} from '../lib/mapbox';
import { buildFeatureCollection, styleForLayerType } from '../lib/mapStyles';
import 'leaflet/dist/leaflet.css';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function FitNorthernTerritory() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(NT_BOUNDS, { padding: [24, 24] });
  }, [map]);

  return null;
}

export default function OverviewMap({
  sites = [],
  layers = [],
  visibleLayerIds = new Set(),
  showTerritory = true,
  indigenousGeoJson = null,
  selectedIndigenousCode = '',
  indigenousLocations = [],
  zoomToSiteRef,
  zoomToIndigenousRef,
}) {
  const token = getMapboxToken();
  const safeLayers = Array.isArray(layers) ? layers : [];
  const geojson = useMemo(
    () => buildFeatureCollection(safeLayers, visibleLayerIds),
    [safeLayers, visibleLayerIds],
  );

  if (!token) {
    return (
      <div className="map-placeholder">
        <h3>Mapbox token required</h3>
        <p>
          Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to <code>site-viewer/.env</code> and
          restart the dev server.
        </p>
      </div>
    );
  }

  return (
    <MapContainer
      center={NT_CENTER}
      zoom={NT_ZOOM}
      className="leaflet-map leaflet-map-full"
      scrollWheelZoom
      zoomControl
      maxZoom={20}
    >
      <TileLayer
        url={getMapboxTileUrl(token)}
        attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        tileSize={512}
        zoomOffset={-1}
        maxZoom={20}
      />
      <FitNorthernTerritory />
      <MapBoundaryLayers
        showTerritory={showTerritory}
        indigenousGeoJson={indigenousGeoJson}
        selectedIndigenousCode={selectedIndigenousCode}
      />
      <GeoJSON
        key={geojson.features.length}
        data={geojson}
        style={(feature) =>
          styleForLayerType(feature.properties._layerType, feature.properties._color)
        }
        onEachFeature={(feature, leafletLayer) => {
          const p = feature.properties;
          const siteLink = p._siteSlug
            ? `<br/><a href="/sites/${p._siteSlug}">${escapeHtml(p._siteName)}</a>`
            : p._siteName
              ? `<br/>${escapeHtml(p._siteName)}`
              : '';
          leafletLayer.bindPopup(
            `<strong>${escapeHtml(p._layerName)}</strong>${siteLink}<br/>${Number(p._areaM2).toLocaleString('en-AU', { maximumFractionDigits: 1 })} m²`,
          );
        }}
      />
      <IndigenousZoomBridge
        locations={indigenousLocations}
        registerZoomHandler={(fn) => {
          if (zoomToIndigenousRef) zoomToIndigenousRef.current = fn;
        }}
      />
      <SiteZoomBridge
        sites={sites}
        layers={safeLayers}
        registerZoomHandler={(fn) => {
          if (zoomToSiteRef) zoomToSiteRef.current = fn;
        }}
      />
    </MapContainer>
  );
}
