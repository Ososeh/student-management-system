// Friendly fallback for browser URLs that do not match any route.
import { Link } from "react-router-dom";
export default function NotFound() {
  // This page is selected by App's wildcard route when no path matches.
  return (
    <div className="not-found">
      <span className="kicker">404</span>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="button button-primary" to="/dashboard">
        Back to dashboard
      </Link>
    </div>
  );
}
