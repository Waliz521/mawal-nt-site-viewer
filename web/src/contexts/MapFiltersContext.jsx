import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchIndigenousLocationsGeoJson,
  filterIndigenousGeoJson,
  listIndigenousLocations,
} from '../lib/boundaries';
import { LAYER_TYPE_ORDER } from '../lib/layerTypes';
import { fetchAllLayers, fetchSites } from '../lib/supabase';

const MapFiltersContext = createContext(null);

function computeVisibleLayerIds(layers, visibleSiteIds, visibleTypes) {
  return new Set(
    layers
      .filter(
        (l) => visibleSiteIds.has(l.site_id) && visibleTypes.has(l.layer_type),
      )
      .map((l) => l.id),
  );
}

export function MapFiltersProvider({ children }) {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  const [sites, setSites] = useState([]);
  const [layers, setLayers] = useState([]);
  const [indigenousGeoJson, setIndigenousGeoJson] = useState(null);
  const [indigenousLocations, setIndigenousLocations] = useState([]);
  const [selectedIndigenousCode, setSelectedIndigenousCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [visibleSiteIds, setVisibleSiteIds] = useState(() => new Set());
  const [visibleTypes, setVisibleTypes] = useState(() => new Set(LAYER_TYPE_ORDER));
  const [showTerritory, setShowTerritory] = useState(true);
  const zoomToSiteRef = useRef(null);
  const zoomToIndigenousRef = useRef(null);

  useEffect(() => {
    if (!isMapPage) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchSites(), fetchAllLayers(), fetchIndigenousLocationsGeoJson()])
      .then(([siteRows, layerRows, indigenousData]) => {
        if (cancelled) return;
        setSites(siteRows);
        setLayers(layerRows);
        setIndigenousGeoJson(indigenousData);
        setIndigenousLocations(listIndigenousLocations(indigenousData));
        setVisibleSiteIds(new Set(siteRows.map((s) => s.id)));
        const presentTypes = new Set(layerRows.map((r) => r.layer_type));
        setVisibleTypes(new Set(LAYER_TYPE_ORDER.filter((t) => presentTypes.has(t))));
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMapPage]);

  const filteredIndigenousGeoJson = useMemo(
    () => filterIndigenousGeoJson(indigenousGeoJson, selectedIndigenousCode),
    [indigenousGeoJson, selectedIndigenousCode],
  );

  const visibleLayerIds = useMemo(
    () => computeVisibleLayerIds(layers, visibleSiteIds, visibleTypes),
    [layers, visibleSiteIds, visibleTypes],
  );

  const toggleSite = useCallback((siteId) => {
    setVisibleSiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }, []);

  const toggleType = useCallback((type) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const showAllSites = useCallback(() => {
    setVisibleSiteIds(new Set(sites.map((s) => s.id)));
  }, [sites]);

  const hideAllSites = useCallback(() => {
    setVisibleSiteIds(new Set());
  }, []);

  const showAllTypes = useCallback(() => {
    setVisibleTypes(new Set(LAYER_TYPE_ORDER));
  }, []);

  const hideAllTypes = useCallback(() => {
    setVisibleTypes(new Set());
  }, []);

  const zoomToSite = useCallback((siteId) => {
    zoomToSiteRef.current?.(siteId);
  }, []);

  const selectCommunity = useCallback(
    (siteId) => {
      if (!siteId) {
        setVisibleSiteIds(new Set(sites.map((s) => s.id)));
        return;
      }

      setVisibleSiteIds(new Set([siteId]));
      window.requestAnimationFrame(() => {
        zoomToSiteRef.current?.(siteId);
      });
    },
    [sites],
  );

  const selectIndigenousLocation = useCallback((code) => {
    setSelectedIndigenousCode(code);
    if (code) {
      window.requestAnimationFrame(() => {
        zoomToIndigenousRef.current?.(code);
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      isMapPage,
      sites,
      layers,
      indigenousGeoJson,
      indigenousLocations,
      selectedIndigenousCode,
      filteredIndigenousGeoJson,
      loading,
      error,
      loaded,
      visibleSiteIds,
      visibleTypes,
      visibleLayerIds,
      showTerritory,
      zoomToSiteRef,
      zoomToIndigenousRef,
      toggleSite,
      toggleType,
      showAllSites,
      hideAllSites,
      showAllTypes,
      hideAllTypes,
      zoomToSite,
      selectCommunity,
      selectIndigenousLocation,
      setShowTerritory,
    }),
    [
      isMapPage,
      sites,
      layers,
      indigenousGeoJson,
      indigenousLocations,
      selectedIndigenousCode,
      filteredIndigenousGeoJson,
      loading,
      error,
      loaded,
      visibleSiteIds,
      visibleTypes,
      visibleLayerIds,
      showTerritory,
      toggleSite,
      toggleType,
      showAllSites,
      hideAllSites,
      showAllTypes,
      hideAllTypes,
      zoomToSite,
      selectCommunity,
      selectIndigenousLocation,
    ],
  );

  return (
    <MapFiltersContext.Provider value={value}>{children}</MapFiltersContext.Provider>
  );
}

export function useMapFilters() {
  const ctx = useContext(MapFiltersContext);
  if (!ctx) throw new Error('useMapFilters must be used within MapFiltersProvider');
  return ctx;
}

export function useMapFiltersOptional() {
  return useContext(MapFiltersContext);
}
