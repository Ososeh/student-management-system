// Progress is stored on the server so it survives refreshes, closed browsers,
// and logouts. The server associates each request with the verified user id.
import api from "./api";

export const progressService = {
  // Retrieve page, search, and unfinished-form details for the authenticated user.
  async get() {
    const { data } = await api.get("/progress");
    return data.progress;
  },
  // Send only changed fields; the server merges them into this user's saved state.
  async update(changes) {
    const { data } = await api.put("/progress", changes);
    return data.progress;
  },
};
