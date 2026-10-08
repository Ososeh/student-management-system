// Component test for the route guard's loading state. MemoryRouter supplies
// routing context without opening a real browser or changing the address bar.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
const mockAuth = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock("../context/AuthContext", () => mockAuth);
describe("ProtectedRoute", () => {
  it("shows a session check while loading", () => {
    mockAuth.useAuth.mockReturnValue({ loading: true, isAuthenticated: false });
    render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
