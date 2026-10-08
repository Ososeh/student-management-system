// Student-specific API adapter. Components use these named operations rather
// than building URLs or interpreting Axios response wrappers themselves.
import api from "./api";
export const studentService = {
  async getAll(params = {}) {
    const { data } = await api.get("/students", { params });
    return data.students;
  },
  async getById(id) {
    const { data } = await api.get(`/students/${id}`);
    return data.student;
  },
  async create(s) {
    const { data } = await api.post("/students", s);
    return data.student;
  },
  async update(id, s) {
    const { data } = await api.put(`/students/${id}`, s);
    return data.student;
  },
  async remove(id) {
    await api.delete(`/students/${id}`);
  },
};
