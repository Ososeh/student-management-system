// Student-specific API adapter. Components use these named operations rather
// than building URLs or interpreting Axios response wrappers themselves.
import api from "./api";
export const studentService = {
  // Optional query parameters let the API filter a list, e.g. by search text.
  async getAll(params = {}) {
    const { data } = await api.get("/students", { params });
    return data.students;
  },
  // Fetch a single student, including the related course the API decorates it with.
  async getById(id) {
    const { data } = await api.get(`/students/${id}`);
    return data.student;
  },
  // Create sends the student's form data and returns the stored record.
  async create(s) {
    const { data } = await api.post("/students", s);
    return data.student;
  },
  // Update sends changed form fields and returns the saved record.
  async update(id, s) {
    const { data } = await api.put(`/students/${id}`, s);
    return data.student;
  },
  // Delete resolves only after the server confirms it removed the record.
  async remove(id) {
    await api.delete(`/students/${id}`);
  },
};
