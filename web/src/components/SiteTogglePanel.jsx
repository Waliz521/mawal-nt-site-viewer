import { Link } from 'react-router-dom';
import TrafficLightBadge from './TrafficLightBadge';

export function SiteTogglePanel({
  sites = [],
  visibleSiteIds,
  onToggleSite,
  onShowAllSites,
  onHideAllSites,
  onZoomToSite,
}) {
  const safeSites = Array.isArray(sites) ? sites : [];

  return (
    <div className="site-toggle-panel">
      <h2 className="sidebar-section-title">By site</h2>
      <p className="sidebar-section-hint">
        Toggle KML layers per community. Right-click a site name on the map → Zoom to
        layer.
      </p>

      <div className="layer-toggle-actions">
        <button type="button" onClick={onShowAllSites}>
          Show all sites
        </button>
        <button type="button" onClick={onHideAllSites}>
          Hide all sites
        </button>
      </div>

      <div className="site-toggle-list">
        {[...safeSites]
          .sort((a, b) => (a.site_number ?? 999) - (b.site_number ?? 999) || a.name.localeCompare(b.name))
          .map((site) => (
          <div key={site.id} className="site-toggle-row">
            <label className="layer-toggle layer-toggle-compact site-toggle-label-row">
              <input
                type="checkbox"
                checked={visibleSiteIds.has(site.id)}
                onChange={() => onToggleSite(site.id)}
              />
              <span className="site-toggle-name">{site.name}</span>
            </label>
            <div className="site-toggle-actions-inline">
              <TrafficLightBadge rating={site.traffic_light} />
              <button
                type="button"
                className="site-zoom-btn"
                title="Zoom to site"
                onClick={() => onZoomToSite(site.id)}
              >
                Zoom
              </button>
              <Link to={`/sites/${site.slug}`} className="site-link-btn" title="Open site">
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
