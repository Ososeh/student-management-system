import api from "./api";
const TOKEN = "sms_token",
  USER = "sms_user";
const store = (r) => {
  localStorage.setItem(TOKEN, r.token);
  localStorage.setItem(USER, JSON.stringify(r.user));
};
export const authService = {
  async login(c) {
    const { data } = await api.post("/auth/login", c);
    store(data);
    return data;
  },
  async register(d) {
    const { data } = await api.post("/auth/register", d);
    store(data);
    return data;
  },
  async getMe() {
    const { data } = await api.get("/auth/me");
    return data.user;
  },
  logout() {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
  },
  getToken() {
    return localStorage.getItem(TOKEN);
  },
  getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem(USER) || "null");
    } catch {
      return null;
    }
  },
  storeUser(u) {
    localStorage.setItem(USER, JSON.stringify(u));
  },
};
