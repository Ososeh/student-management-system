// Authentication API boundary. This module translates login/register requests
// into API calls and persists the returned token/profile for page reloads.
import api from "./api";
const TOKEN = "sms_token",
  USER = "sms_user";
// Keep storage keys in one place so every authentication operation reads and
// clears the same browser entries.
const store = (r) => {
  // localStorage survives refreshes; the token authorizes requests and the
  // profile lets the interface render immediately while the token is checked.
  localStorage.setItem(TOKEN, r.token);
  localStorage.setItem(USER, JSON.stringify(r.user));
};
export const authService = {
  // The server validates credentials and returns a token plus safe user data.
  async login(c) {
    const { data } = await api.post("/auth/login", c);
    store(data);
    return data;
  },
  // Registration creates an account and signs it in using the returned session.
  async register(d) {
    const { data } = await api.post("/auth/register", d);
    store(data);
    return data;
  },
  // Ask the server to validate the saved token before trusting a cached profile.
  async getMe() {
    // Ask the server for a trusted profile rather than trusting cached data.
    const { data } = await api.get("/auth/me");
    return data.user;
  },
  // Logout removes only this app's saved session; server-owned records remain.
  logout() {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
  },
  // Return the bearer token used by the shared API request interceptor.
  getToken() {
    return localStorage.getItem(TOKEN);
  },
  // Cached profile is only for quick display and is verified by getMe().
  getStoredUser() {
    try {
      // JSON.parse rebuilds the object previously stored as text.
      return JSON.parse(localStorage.getItem(USER) || "null");
    } catch {
      return null;
    }
  },
  // Refresh the cached safe profile after the server confirms the session.
  storeUser(u) {
    localStorage.setItem(USER, JSON.stringify(u));
  },
};
