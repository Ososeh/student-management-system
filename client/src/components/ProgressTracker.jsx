// Remember the authenticated user's current workspace route on the server.
// This small component has no visible UI; mounting it beside App lets it notice
// route changes regardless of which protected page is currently displayed.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProgressTracker() {
  const location = useLocation();
  const {
    isAuthenticated,
    loading,
    progressReady,
    progress,
    saveProgress,
  } = useAuth();

  useEffect(() => {
    if (
      loading ||
      !progressReady ||
      !isAuthenticated ||
      location.pathname === "/login" ||
      location.pathname === "/register" ||
      progress.lastPath === location.pathname
    ) {
      return;
    }
    // Save only the pathname, not search parameters or credentials. A rejected
    // save is displayed by the shared workspace error message in the layout.
    saveProgress({ lastPath: location.pathname }).catch(() => {});
  }, [
    isAuthenticated,
    loading,
    location.pathname,
    progress.lastPath,
    progressReady,
    saveProgress,
  ]);

  return null;
}
