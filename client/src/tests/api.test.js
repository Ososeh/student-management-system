// Service unit test: fake Axios so the test checks the student's API path and
// response mapping without needing a running server or a network connection.
import { describe, expect, it, vi } from "vitest";
// Replace Axios with a controllable fake so test requests never use the network.
vi.mock("axios", () => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };
  return { default: { create: vi.fn(() => client) } };
});
import api from "../services/api";
import { studentService } from "../services/studentService";

// The service must return plain student data instead of Axios's wrapper.
describe("student service", () => {
  // This example protects the collection URL and the default empty query object.
  it("uses the list endpoint", async () => {
    // Arrange: pretend the API returned one row.
    api.get.mockResolvedValue({
      data: { students: [{ id: "1", name: "Test" }] },
    });
    // Assert: callers receive `students`, and Axios got the expected arguments.
    await expect(studentService.getAll()).resolves.toEqual([
      { id: "1", name: "Test" },
    ]);
    expect(api.get).toHaveBeenCalledWith("/students", { params: {} });
  });
});
