import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import { BOUNDARY_PANE, fetchNtBoundaryGeoJson } from '../lib/boundaries';
import { boundsFromFeature } from '../lib/geojson';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NT_BOUNDARY_STYLE = {
  color: '#000000',
  weight: 2.5,
  opacity: 0.95,
  fillColor: '#ffffff',
  fillOpacity: 0.03,
};

const INDIGENOUS_STYLE = {
  color: '#000000',
  weight: 1.75,
  opacity: 0.9,
  fillColor: '#fbbf24',
  fillOpacity: 0.07,
};

const INDIGENOUS_SELECTED_STYLE = {
  ...INDIGENOUS_STYLE,
  weight: 2.5,
  fillOpacity: 0.14,
};

function NtBoundaryLayer({ visible }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchNtBoundaryGeoJson()
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible || !data) return null;

  return (
    <GeoJSON
      data={data}
      pane={BOUNDARY_PANE}
      style={() => NT_BOUNDARY_STYLE}
      interactive={false}
    />
  );
}

export function IndigenousZoomBridge({ locations = [], registerZoomHandler }) {
  const map = useMap();

  useEffect(() => {
    function zoomToIndigenousLocation(code) {
      const location = locations.find((row) => row.code === code);
      if (!location) return;

      const bounds = boundsFromFeature(location.feature);
      if (!bounds) return;

      map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng],
        ],
        { padding: [40, 40], maxZoom: 14 },
      );
    }

    registerZoomHandler?.(zoomToIndigenousLocation);
  });

  return null;
}

export default function MapBoundaryLayers({
  showTerritory = true,
  indigenousGeoJson = null,
  selectedIndigenousCode = '',
}) {
  return (
    <>
      <NtBoundaryLayer visible={showTerritory} />
      {indigenousGeoJson ? (
        <GeoJSON
          key={`iloc-${selectedIndigenousCode || 'all'}-${indigenousGeoJson.features?.length ?? 0}`}
          data={indigenousGeoJson}
          pane={BOUNDARY_PANE}
          style={() =>
            selectedIndigenousCode ? INDIGENOUS_SELECTED_STYLE : INDIGENOUS_STYLE
          }
          onEachFeature={(feature, layer) => {
            const props = feature.properties ?? {};
            layer.bindPopup(
              `<strong>${escapeHtml(props.ILO_NAME21 ?? 'Community')}</strong><br/>${escapeHtml(props.IRE_NAME21 ?? '')}`,
            );
          }}
        />
      ) : null}
    </>
  );
}
