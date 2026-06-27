import { useMemo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { boundsFromLayers } from '../lib/geojson';
import { trafficLightMarkerStyle } from '../lib/trafficLight';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sitePosition(site, layersBySite) {
  if (site.lat != null && site.lng != null) {
    return [site.lat, site.lng];
  }

  const bounds = boundsFromLayers(layersBySite[site.id] ?? []);
  if (!bounds) return null;

  return [(bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2];
}

export default function SiteStatusMarkers({
  sites = [],
  layers = [],
  visibleSiteIds = new Set(),
}) {
  const layersBySite = useMemo(() => {
    const map = {};
    for (const layer of layers) {
      if (!map[layer.site_id]) map[layer.site_id] = [];
      map[layer.site_id].push(layer);
    }
    return map;
  }, [layers]);

  const markers = useMemo(() => {
    return sites
      .filter((site) => visibleSiteIds.has(site.id))
      .map((site) => {
        const position = sitePosition(site, layersBySite);
        if (!position) return null;
        return { site, position };
      })
      .filter(Boolean);
  }, [sites, layersBySite, visibleSiteIds]);

  return (
    <>
      {markers.map(({ site, position }) => {
        const style = trafficLightMarkerStyle(site.traffic_light);
        return (
          <CircleMarker
            key={site.id}
            center={position}
            radius={9}
            pathOptions={{
              color: style.stroke,
              weight: 2,
              fillColor: style.fill,
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <strong>{escapeHtml(site.name)}</strong>
              <br />
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.35rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: style.stroke,
                  background: `${style.fill}22`,
                  border: `1px solid ${style.fill}`,
                }}
              >
                {site.traffic_light ?? 'N/A'}
              </span>
              <br />
              <a href={`/sites/${site.slug}`} style={{ fontSize: '0.85rem' }}>
                Open site detail
              </a>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
