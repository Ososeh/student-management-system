import api from "./api";
export const courseService = {
  async getAll() {
    const { data } = await api.get("/courses");
    return data.courses;
  },
  async getById(id) {
    const { data } = await api.get(`/courses/${id}`);
    return data.course;
  },
  async create(c) {
    const { data } = await api.post("/courses", c);
    return data.course;
  },
  async update(id, c) {
    const { data } = await api.put(`/courses/${id}`, c);
    return data.course;
  },
  async remove(id) {
    await api.delete(`/courses/${id}`);
  },
};
