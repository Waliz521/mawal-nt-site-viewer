import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AreaTable from '../components/AreaTable';
import SiteMap from '../components/SiteMap';
import SiteMetadata, { AreaTotals } from '../components/SiteMetadata';
import TrafficLightBadge from '../components/TrafficLightBadge';
import { LAYER_TYPE_ORDER } from '../lib/layerTypes';
import { fetchSiteBySlug, fetchSiteLayers } from '../lib/supabase';

export default function SiteDetailPage() {
  const { slug } = useParams();
  const [site, setSite] = useState(null);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialVisible = useMemo(() => new Set(LAYER_TYPE_ORDER), []);
  const [visibleTypes, setVisibleTypes] = useState(initialVisible);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchSiteBySlug(slug)
      .then(async (siteRow) => {
        if (!siteRow) throw new Error('Site not found');
        setSite(siteRow);
        const layerRows = await fetchSiteLayers(siteRow.id);
        setLayers(layerRows);

        const presentTypes = new Set(layerRows.map((l) => l.layer_type));
        setVisibleTypes(new Set(LAYER_TYPE_ORDER.filter((t) => presentTypes.has(t))));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function toggleType(type) {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  if (loading) return <div className="state-msg">Loading site…</div>;

  if (error || !site) {
    return (
      <div className="state-msg error">
        <h2>Site not available</h2>
        <p>{error ?? 'Not found'}</p>
        <Link to="/">← Back to all sites</Link>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <Link to="/" className="back-link">
          ← All sites
        </Link>
        <div className="detail-title">
          <div>
            <span className="site-number">Site {site.site_number ?? '—'}</span>
            <h1>{site.name}</h1>
            <p>
              {site.region ?? 'NT'}
              {site.land_council ? ` · ${site.land_council}` : ''}
            </p>
          </div>
          <TrafficLightBadge rating={site.traffic_light} large />
        </div>
      </div>

      <div className="detail-layout">
        <section className="map-panel panel">
          <SiteMap site={site} layers={layers} visibleTypes={visibleTypes} />
        </section>

        <aside className="detail-sidebar">
          <SiteMetadata site={site} />
          <AreaTotals layers={layers} />
          <AreaTable
            layers={layers}
            visibleTypes={visibleTypes}
            onToggleType={toggleType}
          />
        </aside>
      </div>
    </div>
  );
}
