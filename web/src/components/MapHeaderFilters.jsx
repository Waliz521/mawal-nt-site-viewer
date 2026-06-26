import { useEffect, useMemo, useRef, useState } from 'react';
import { useMapFiltersOptional } from '../contexts/MapFiltersContext';
import { layerTypeLabel, LAYER_TYPE_ORDER } from '../lib/layerTypes';
import SearchableSelect from './SearchableSelect';

function HeaderFilterDropdown({ label, summary, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`header-filter${open ? ' is-open' : ''}`}>
      <span className="header-filter-label">{label}</span>
      <button
        type="button"
        className="header-filter-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="searchable-select-value">{summary}</span>
        <span className="header-filter-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? <div className="header-filter-menu panel">{children}</div> : null}
    </div>
  );
}

function typeVisibility(type, layers, visibleSiteIds, visibleTypes) {
  if (!visibleTypes.has(type)) return 'none';

  const typeLayers = layers.filter((l) => l.layer_type === type);
  if (typeLayers.length === 0) return 'none';

  const visibleCount = typeLayers.filter((l) => visibleSiteIds.has(l.site_id)).length;
  if (visibleCount === 0) return 'none';
  if (visibleCount === typeLayers.length) return 'all';
  return 'partial';
}

function MapFilterControls({
  communityOptions,
  indigenousOptions,
  selectedCommunityId,
  selectedIndigenousCode,
  layersSummary,
  layerTypes,
  layers,
  visibleSiteIds,
  visibleTypes,
  typeCounts,
  selectCommunity,
  selectIndigenousLocation,
  toggleType,
  showAllTypes,
  hideAllTypes,
}) {
  return (
    <>
      <SearchableSelect
        label="Community"
        value={selectedCommunityId}
        onChange={selectCommunity}
        options={communityOptions}
        allOption={{ value: '', label: 'All communities' }}
        searchPlaceholder="Search communities…"
        emptyMessage="No communities found"
        minWidth="11rem"
      />

      <HeaderFilterDropdown label="Layers" summary={layersSummary}>
        <div className="layer-toggle-actions">
          <button type="button" onClick={showAllTypes}>
            Show all
          </button>
          <button type="button" onClick={hideAllTypes}>
            Hide all
          </button>
        </div>
        <div className="header-filter-list header-layer-list">
          {layerTypes.map((type) => {
            const sample = layers.find((l) => l.layer_type === type);
            const state = typeVisibility(type, layers, visibleSiteIds, visibleTypes);
            return (
              <label key={type} className="header-layer-row">
                <input
                  type="checkbox"
                  checked={state === 'all' || state === 'partial'}
                  ref={(el) => {
                    if (el) el.indeterminate = state === 'partial';
                  }}
                  onChange={() => toggleType(type)}
                />
                <span
                  className="swatch"
                  style={{ background: sample?.color_hex ?? '#999' }}
                />
                <span className="header-layer-name">{layerTypeLabel(type)}</span>
                <span className="header-layer-count">{typeCounts[type]}</span>
              </label>
            );
          })}
        </div>
      </HeaderFilterDropdown>

      <SearchableSelect
        label="Indigenous location"
        value={selectedIndigenousCode}
        onChange={selectIndigenousLocation}
        options={indigenousOptions}
        allOption={{ value: '', label: 'All locations' }}
        searchPlaceholder="Search locations…"
        emptyMessage="No locations found"
        minWidth="12rem"
      />
    </>
  );
}

export default function MapHeaderFilters() {
  const filters = useMapFiltersOptional();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  const sites = filters?.sites ?? [];
  const layers = filters?.layers ?? [];
  const visibleSiteIds = filters?.visibleSiteIds ?? new Set();
  const visibleTypes = filters?.visibleTypes ?? new Set();
  const indigenousLocations = filters?.indigenousLocations ?? [];
  const selectedIndigenousCode = filters?.selectedIndigenousCode ?? '';

  const sortedSites = useMemo(() => {
    return [...sites].sort(
      (a, b) =>
        (a.site_number ?? 999) - (b.site_number ?? 999) || a.name.localeCompare(b.name),
    );
  }, [sites]);

  const communityOptions = useMemo(
    () => sortedSites.map((site) => ({ value: site.id, label: site.name })),
    [sortedSites],
  );

  const indigenousOptions = useMemo(
    () => indigenousLocations.map((location) => ({ value: location.code, label: location.name })),
    [indigenousLocations],
  );

  const layerTypes = LAYER_TYPE_ORDER.filter((type) =>
    layers.some((l) => l.layer_type === type),
  );

  const typeCounts = layerTypes.reduce((acc, type) => {
    acc[type] = layers.filter((l) => l.layer_type === type).length;
    return acc;
  }, {});

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  if (!filters?.isMapPage || filters.loading) return null;

  const { toggleType, showAllTypes, hideAllTypes, selectCommunity, selectIndigenousLocation } =
    filters;

  const visibleSites = sortedSites.filter((site) => visibleSiteIds.has(site.id));
  const selectedCommunityId = visibleSites.length === 1 ? visibleSites[0].id : '';

  const visibleTypeCount = layerTypes.filter((t) => visibleTypes.has(t)).length;
  const layersSummary =
    visibleTypeCount === 0
      ? 'None visible'
      : visibleTypeCount === layerTypes.length
        ? 'All layers'
        : `${visibleTypeCount} of ${layerTypes.length}`;

  const filterProps = {
    communityOptions,
    indigenousOptions,
    selectedCommunityId,
    selectedIndigenousCode,
    layersSummary,
    layerTypes,
    layers,
    visibleSiteIds,
    visibleTypes,
    typeCounts,
    selectCommunity,
    selectIndigenousLocation,
    toggleType,
    showAllTypes,
    hideAllTypes,
  };

  return (
    <div ref={wrapRef} className={`header-filters-wrap${menuOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="header-filters-toggle"
        aria-expanded={menuOpen}
        aria-controls="map-header-filters"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="header-filters-toggle-icon" aria-hidden="true">
          ☰
        </span>
        <span>Filters</span>
      </button>

      <div id="map-header-filters" className="header-filters">
        <MapFilterControls {...filterProps} />
      </div>
    </div>
  );
}
