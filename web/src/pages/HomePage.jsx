import { useEffect, useMemo, useState } from 'react';
import SiteCard from '../components/SiteCard';
import SetupRequired from '../components/SetupRequired';
import { fetchSites } from '../lib/supabase';
import { siteMatchesQuery } from '../lib/search';

export default function HomePage() {
  const [sites, setSites] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSites()
      .then(setSites)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return sites.filter((site) => {
      const matchesQuery = siteMatchesQuery(site, query);
      const matchesFilter = filter === 'ALL' || site.traffic_light === filter;
      return matchesQuery && matchesFilter;
    });
  }, [sites, query, filter]);

  const queryMatchesIgnoringFilter = useMemo(() => {
    if (!query.trim()) return 0;
    return sites.filter((site) => siteMatchesQuery(site, query)).length;
  }, [sites, query]);

  const counts = useMemo(() => {
    return sites.reduce(
      (acc, s) => {
        acc.total += 1;
        if (s.traffic_light === 'GREEN') acc.green += 1;
        if (s.traffic_light === 'AMBER') acc.amber += 1;
        if (s.traffic_light === 'RED') acc.red += 1;
        return acc;
      },
      { total: 0, green: 0, amber: 0, red: 0 },
    );
  }, [sites]);

  if (loading) return <div className="state-msg">Loading sites…</div>;
  if (error) {
    return (
      <SetupRequired message={error} />
    );
  }

  const showFilterHint =
    query.trim() &&
    filtered.length === 0 &&
    queryMatchesIgnoringFilter > 0 &&
    filter !== 'ALL';

  return (
    <div className="home-page">
      <section className="hero">
        <h1>NT community power-station sites</h1>
        <p>
          {counts.total} sites with KML profiles · {counts.green} green · {counts.amber}{' '}
          amber · {counts.red} red
        </p>
      </section>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, region, slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search sites"
        />
        <div className="filter-group">
          {['ALL', 'GREEN', 'AMBER', 'RED'].map((value) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {value === 'ALL' ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {query.trim() ? (
        <p className="results-hint">
          {filtered.length} result{filtered.length === 1 ? '' : 's'} for &ldquo;{query.trim()}&rdquo;
          {filter !== 'ALL' ? ` (${filter} filter active)` : ''}
        </p>
      ) : null}

      {showFilterHint ? (
        <div className="filter-hint">
          <p>
            {queryMatchesIgnoringFilter} site{queryMatchesIgnoringFilter === 1 ? '' : 's'} match
            your search but not the <strong>{filter}</strong> filter.
          </p>
          <button type="button" onClick={() => setFilter('ALL')}>
            Show all matching sites
          </button>
        </div>
      ) : null}

      <div className="site-grid">
        {filtered.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>

      {filtered.length === 0 && !showFilterHint ? (
        <p className="state-msg">No sites match your search.</p>
      ) : null}
    </div>
  );
}
