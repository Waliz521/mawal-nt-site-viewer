import OverviewMap from '../components/OverviewMap';
import SetupRequired from '../components/SetupRequired';
import { useMapFilters } from '../contexts/MapFiltersContext';

export default function MapPage() {
  const {
    sites,
    layers,
    loading,
    error,
    visibleLayerIds,
    showTerritory,
    filteredIndigenousGeoJson,
    selectedIndigenousCode,
    indigenousLocations,
    zoomToSiteRef,
    zoomToIndigenousRef,
  } = useMapFilters();

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
        showTerritory={showTerritory}
        indigenousGeoJson={filteredIndigenousGeoJson}
        selectedIndigenousCode={selectedIndigenousCode}
        indigenousLocations={indigenousLocations}
        zoomToSiteRef={zoomToSiteRef}
        zoomToIndigenousRef={zoomToIndigenousRef}
      />
    </div>
  );
}
