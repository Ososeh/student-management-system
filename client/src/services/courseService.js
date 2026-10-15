// Course-specific API adapter; keeping HTTP details here makes page components
// easier to read and ensures every course operation uses the shared API client.
import api from "./api";
export const courseService = {
  // Get the current user's course list; the API client adds authentication.
  async getAll() {
    const { data } = await api.get("/courses");
    return data.courses;
  },
  // Return one course selected by its stable id from the URL.
  async getById(id) {
    const { data } = await api.get(`/courses/${id}`);
    return data.course;
  },
  // Create expects the course fields and unwraps the API's response envelope.
  async create(c) {
    const { data } = await api.post("/courses", c);
    return data.course;
  },
  // Update a course by id and return the server's normalized saved version.
  async update(id, c) {
    const { data } = await api.put(`/courses/${id}`, c);
    return data.course;
  },
  // Delete has no response body, so callers await completion only.
  async remove(id) {
    await api.delete(`/courses/${id}`);
  },
};
