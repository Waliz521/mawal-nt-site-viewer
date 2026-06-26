import { layerTypeLabel, LAYER_TYPE_ORDER } from '../lib/layerTypes';

function typeVisibility(type, layers, visibleSiteIds, visibleTypes) {
  if (!visibleTypes.has(type)) return 'none';

  const typeLayers = layers.filter((l) => l.layer_type === type);
  if (typeLayers.length === 0) return 'none';

  const visibleCount = typeLayers.filter((l) => visibleSiteIds.has(l.site_id)).length;
  if (visibleCount === 0) return 'none';
  if (visibleCount === typeLayers.length) return 'all';
  return 'partial';
}

export default function LayerTogglePanel({
  layers,
  visibleSiteIds,
  visibleTypes,
  onToggleType,
  onShowAll,
  onHideAll,
}) {
  const grouped = LAYER_TYPE_ORDER.filter((type) =>
    layers.some((l) => l.layer_type === type),
  );

  const counts = grouped.reduce((acc, type) => {
    acc[type] = layers.filter((l) => l.layer_type === type).length;
    return acc;
  }, {});

  return (
    <div className="layer-toggle-panel">
      <h2 className="sidebar-section-title">By layer type</h2>
      <div className="layer-toggle-actions">
        <button type="button" onClick={onShowAll}>
          Show all types
        </button>
        <button type="button" onClick={onHideAll}>
          Hide all types
        </button>
      </div>

      <div className="layer-toggles layer-toggles-vertical">
        {grouped.map((type) => {
          const sample = layers.find((l) => l.layer_type === type);
          const state = typeVisibility(type, layers, visibleSiteIds, visibleTypes);
          return (
            <label key={type} className="layer-toggle">
              <input
                type="checkbox"
                checked={state === 'all' || state === 'partial'}
                ref={(el) => {
                  if (el) el.indeterminate = state === 'partial';
                }}
                onChange={() => onToggleType(type)}
              />
              <span
                className="swatch"
                style={{ background: sample?.color_hex ?? '#999' }}
              />
              <span className="layer-toggle-label">
                {layerTypeLabel(type)}
                <em>{counts[type]}</em>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
