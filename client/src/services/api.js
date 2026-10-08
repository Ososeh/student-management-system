// One shared Axios client centralizes the API base URL and cross-cutting
// behavior, so pages/services do not each implement URL or token handling.
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  // Attach the saved bearer token automatically to protected API calls.
  const token = localStorage.getItem("sms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    // A 401 means the server rejected the session; discard stale local tokens.
    console.error("API request failed.");
    if (error.response?.status === 401) {
      localStorage.removeItem("sms_token");
      localStorage.removeItem("sms_user");
    }
    return Promise.reject(error);
  },
);
export default api;
