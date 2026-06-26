import { Navigate, useParams } from 'react-router-dom';
import SiteDetailPage from './SiteDetailPage';

/** Redirect /sites or /sites/ with no slug back to home. */
export function SitesIndexRedirect() {
  return <Navigate to="/" replace />;
}

export function SiteDetailRoute() {
  const { slug } = useParams();

  if (!slug || !slug.trim()) {
    return <Navigate to="/" replace />;
  }

  return <SiteDetailPage />;
}
