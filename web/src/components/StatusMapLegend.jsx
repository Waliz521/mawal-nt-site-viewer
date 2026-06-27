import { TRAFFIC_LIGHT_COLORS } from '../lib/trafficLight';

const LEGEND_ITEMS = [
  { key: 'GREEN', description: 'Fits on layout' },
  { key: 'AMBER', description: 'Minor shortfall (≤ 500 m²)' },
  { key: 'RED', description: 'Major shortfall / outside land' },
];

export default function StatusMapLegend({ counts = {} }) {
  return (
    <div className="status-map-legend" aria-label="Traffic light legend">
      <p className="status-map-legend-title">Site status</p>
      <ul className="status-map-legend-list">
        {LEGEND_ITEMS.map(({ key, description }) => {
          const colors = TRAFFIC_LIGHT_COLORS[key];
          const count = counts[key] ?? 0;
          return (
            <li key={key}>
              <span
                className="status-map-legend-dot"
                style={{ background: colors.fill, borderColor: colors.stroke }}
                aria-hidden="true"
              />
              <span className="status-map-legend-text">
                <strong>{colors.label}</strong>
                <span className="status-map-legend-meta">
                  {description}
                  {count > 0 ? ` · ${count}` : ''}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
