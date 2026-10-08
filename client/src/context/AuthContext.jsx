// Context shares authentication state without passing user/session props
// through every component between the provider and the page using them.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authService } from "../services/authService";
import { progressService } from "../services/progressService";
import { getErrorMessage } from "../utils/errors";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  // Reuse the cached profile for the initial UI, then verify the saved token
  // with the API before considering the session valid.
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);
  // Progress is loaded from the server only after the API confirms the user.
  const [progress, setProgress] = useState({});
  const [progressReady, setProgressReady] = useState(false);
  const [progressError, setProgressError] = useState("");
  const progressQueue = useRef(Promise.resolve());
  const activeUserId = useRef(null);
  const refresh = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      setProgress({});
      setProgressReady(true);
      setLoading(false);
      return;
    }
    try {
      // /auth/me validates the token and returns the current server profile.
      const u = await authService.getMe();
      // Fetch this account's server-side saved page/search/form state.
      const savedProgress = await progressService.get();
      setUser(u);
      setProgress(savedProgress);
      activeUserId.current = u.id;
      authService.storeUser(u);
    } catch (error) {
      console.error("Session validation failed.");
      authService.logout();
      setUser(null);
      setProgress({});
      activeUserId.current = null;
    } finally {
      setProgressReady(true);
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // Check a previously saved session once when this provider starts.
    refresh();
  }, [refresh]);
  const login = useCallback(async (c) => {
    // Persisted response is also copied into React state for immediate UI use.
    const r = await authService.login(c);
    let savedProgress;
    try {
      savedProgress = await progressService.get();
      setProgress(savedProgress);
      setProgressError("");
      activeUserId.current = r.user.id;
      setProgressReady(true);
    } catch (error) {
      // Do not leave one account's token active if its workspace could not be
      // loaded; the user can retry sign-in once the server is available.
      authService.logout();
      setProgress({});
      activeUserId.current = null;
      throw error;
    }
    setUser(r.user);
    return { ...r, progress: savedProgress };
  }, []);
  const register = useCallback(async (d) => {
    const r = await authService.register(d);
    let savedProgress;
    try {
      savedProgress = await progressService.get();
      setProgress(savedProgress);
      setProgressError("");
      activeUserId.current = r.user.id;
      setProgressReady(true);
    } catch (error) {
      authService.logout();
      setProgress({});
      activeUserId.current = null;
      throw error;
    }
    setUser(r.user);
    return { ...r, progress: savedProgress };
  }, []);
  const logout = useCallback(() => {
    // Clear storage and in-memory state together so private screens close now.
    authService.logout();
    console.log("Logout successful.");
    setUser(null);
    setProgress({});
    setProgressError("");
    activeUserId.current = null;
  }, []);
  const saveProgress = useCallback(
    (changes) => {
      if (!user) {
        return Promise.reject(new Error("Sign in before saving workspace progress."));
      }
      const ownerId = user.id;
      setProgress((current) => ({ ...current, ...changes }));
      setProgressError("");
      // Serialize client updates and verify the account is unchanged before
      // sending queued work, preventing a delayed save from crossing accounts.
      const request = progressQueue.current
        .catch(() => {})
        .then(() => {
          if (activeUserId.current !== ownerId) {
            throw new Error("Workspace progress belongs to a different session.");
          }
          return progressService.update(changes);
        });
      progressQueue.current = request.catch(() => {});
      return request
        .then((saved) => {
          setProgress((current) => ({ ...current, ...saved }));
          return saved;
        })
        .catch((error) => {
          setProgressError(getErrorMessage(error, "Could not save workspace progress."));
          throw error;
        });
    },
    [user],
  );
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      progress,
      progressReady,
      progressError,
      login,
      register,
      logout,
      saveProgress,
    }),
    [
      user,
      loading,
      progress,
      progressReady,
      progressError,
      login,
      register,
      logout,
      saveProgress,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  // Detect incorrect placement outside AuthProvider instead of failing later
  // with confusing undefined values in pages.
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
