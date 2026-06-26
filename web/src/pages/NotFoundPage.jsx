import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="state-msg">
      <h2>Page not found</h2>
      <p>This URL is not valid. Pick a site from the home page.</p>
      <Link to="/" className="back-link">
        ← Back to all sites
      </Link>
    </div>
  );
}
