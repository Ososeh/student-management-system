// Service unit test: fake Axios so the test checks the student's API path and
// response mapping without needing a running server or a network connection.
import { describe, expect, it, vi } from "vitest";
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
describe("student service", () => {
  it("uses the list endpoint", async () => {
    api.get.mockResolvedValue({
      data: { students: [{ id: "1", name: "Test" }] },
    });
    await expect(studentService.getAll()).resolves.toEqual([
      { id: "1", name: "Test" },
    ]);
    expect(api.get).toHaveBeenCalledWith("/students", { params: {} });
  });
});
