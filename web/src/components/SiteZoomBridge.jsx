import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { boundsFromLayers } from '../lib/geojson';

export default function SiteZoomBridge({ sites = [], layers = [], registerZoomHandler }) {
  const map = useMap();
  const safeSites = Array.isArray(sites) ? sites : [];
  const safeLayers = Array.isArray(layers) ? layers : [];

  const layersBySite = safeLayers.reduce((acc, layer) => {
    if (!acc[layer.site_id]) acc[layer.site_id] = [];
    acc[layer.site_id].push(layer);
    return acc;
  }, {});

  function zoomToSite(siteId) {
    const siteLayers = layersBySite[siteId] ?? [];
    const bounds = boundsFromLayers(siteLayers);
    if (bounds) {
      map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng],
        ],
        { padding: [48, 48], maxZoom: 17 },
      );
      return;
    }

    const site = safeSites.find((s) => s.id === siteId);
    if (site?.lat != null && site?.lng != null) {
      map.setView([site.lat, site.lng], 15);
    }
  }

  useEffect(() => {
    registerZoomHandler?.(zoomToSite);
  });

  return null;
}
