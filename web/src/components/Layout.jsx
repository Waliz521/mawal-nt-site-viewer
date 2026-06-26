import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { MapFiltersProvider } from '../contexts/MapFiltersContext';
import MapHeaderFilters from './MapHeaderFilters';

export default function Layout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <MapFiltersProvider>
      <div className="app">
        <header className={`app-header app-header-compact${isMapPage ? ' app-header-map' : ''}`}>
          <div className="header-inner">
            <Link to="/" className="brand">
              <span className="brand-mark">M</span>
              <div className="brand-text">
                <strong>Mawal NT Site Viewer</strong>
                {!isMapPage ? (
                  <span className="brand-subtitle">Community power-station KML profiles</span>
                ) : null}
              </div>
            </Link>

            {isMapPage ? <h1 className="header-map-title">Northern Territory Map</h1> : null}

            <div className="header-end">
              <MapHeaderFilters />
              <nav className="header-nav" aria-label="Main">
                <NavLink to="/" end>
                  Sites
                </NavLink>
                <NavLink to="/map">Map</NavLink>
              </nav>
            </div>
          </div>
          {!isMapPage ? (
            <p className="disclaimer">
              Basemap imagery may differ from GIS analysis imagery. KML digitised in Google Earth Pro.
            </p>
          ) : null}
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </MapFiltersProvider>
  );
}
