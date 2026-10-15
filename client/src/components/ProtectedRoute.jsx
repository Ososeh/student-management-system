// Route guard: wait for session validation, allow signed-in users, or redirect
// others to login. The requested URL is saved so login can return them there.
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "./Loader";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute() {
  // Read the shared session state and current URL before choosing a branch.
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  useEffect(() => {
    if (!loading) {
      console.log(
        isAuthenticated
          ? "Protected page access granted."
          : "Protected page access denied.",
      );
    }
  }, [loading, isAuthenticated]);
  // Never redirect while a stored token is still being verified.
  if (loading) return <Loader fullScreen label="Checking your session..." />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Outlet renders the matching child route only after authentication passes.
  return <Outlet />;
}
