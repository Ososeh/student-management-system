import { Link } from "react-router-dom";
export default function NotFound() {
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
