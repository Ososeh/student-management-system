// Progress is stored on the server so it survives refreshes, closed browsers,
// and logouts. The server associates each request with the verified user id.
import api from "./api";

export const progressService = {
  async get() {
    const { data } = await api.get("/progress");
    return data.progress;
  },
  async update(changes) {
    const { data } = await api.put("/progress", changes);
    return data.progress;
  },
};
