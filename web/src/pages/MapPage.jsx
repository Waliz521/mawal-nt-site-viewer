import { useMemo } from 'react';
import OverviewMap from '../components/OverviewMap';
import SetupRequired from '../components/SetupRequired';
import StatusMapLegend from '../components/StatusMapLegend';
import { useMapFilters } from '../contexts/MapFiltersContext';

export default function MapPage() {
  const {
    sites,
    layers,
    loading,
    error,
    visibleLayerIds,
    visibleSiteIds,
    showTerritory,
    filteredIndigenousGeoJson,
    selectedIndigenousCode,
    indigenousLocations,
    zoomToSiteRef,
    zoomToIndigenousRef,
  } = useMapFilters();

  const statusCounts = useMemo(() => {
    return sites.reduce(
      (acc, site) => {
        if (!visibleSiteIds.has(site.id)) return acc;
        if (site.traffic_light === 'GREEN') acc.GREEN += 1;
        if (site.traffic_light === 'AMBER') acc.AMBER += 1;
        if (site.traffic_light === 'RED') acc.RED += 1;
        return acc;
      },
      { GREEN: 0, AMBER: 0, RED: 0 },
    );
  }, [sites, visibleSiteIds]);

  if (loading) {
    return <div className="state-msg map-page-msg">Loading all KML layers…</div>;
  }

  if (error) {
    return <SetupRequired message={error} />;
  }

  return (
    <div className="map-page">
      <OverviewMap
        sites={sites}
        layers={layers}
        visibleLayerIds={visibleLayerIds}
        visibleSiteIds={visibleSiteIds}
        showTerritory={showTerritory}
        indigenousGeoJson={filteredIndigenousGeoJson}
        selectedIndigenousCode={selectedIndigenousCode}
        indigenousLocations={indigenousLocations}
        zoomToSiteRef={zoomToSiteRef}
        zoomToIndigenousRef={zoomToIndigenousRef}
      />
      <StatusMapLegend counts={statusCounts} />
    </div>
  );
}
