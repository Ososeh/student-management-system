import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "./Loader";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute() {
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
  if (loading) return <Loader fullScreen label="Checking your session..." />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
