// Shared shell for public authentication screens. Outlet switches between
// login/register, while an existing session is redirected into the workspace.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <span className="brand-mark">SM</span>
        <span>
          Student<span>Hub</span>
        </span>
      </div>
      <div className="auth-panel">
        <Outlet />
      </div>
      <p className="auth-foot">Student Management System • React Capstone</p>
    </div>
  );
}
