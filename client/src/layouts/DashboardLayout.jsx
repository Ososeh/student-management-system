// Common frame for signed-in pages: navigation, user identity, mobile menu,
// and an Outlet that displays whichever protected page matches the URL.
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
const links = [
  // Navigation is data-driven so each item uses the same rendering and style.
  { to: "/dashboard", label: "Dashboard", icon: "⌂" },
  { to: "/students", label: "Students", icon: "◉" },
  { to: "/courses", label: "Courses", icon: "▣" },
];
export default function DashboardLayout() {
  // Keep only the menu's open/closed state local; identity and logout are
  // shared account data managed by AuthContext.
  const { user, logout, progressError } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
    // Remove the session before replacing the current history entry with login.
    logout();
    navigate("/login", { replace: true });
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">SM</span>
          <span>
            Student<span>Hub</span>
          </span>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {/* Mapping the links avoids repeating the same navigation markup. */}
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span aria-hidden="true">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-mini">
            <span className="avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <button className="logout-link" onClick={handleLogout}>
            ↪ <span>Log out</span>
          </button>
        </div>
      </aside>
      {/* The dimmed overlay closes the mobile drawer when tapped. */}
      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div>
            <span className="eyebrow">Student Management</span>
            <h1>Academic workspace</h1>
          </div>
          <div className="topbar-user">
            <span className="avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
            <span>{user?.name}</span>
          </div>
        </header>
        <div className="page-content">
          {/* Progress errors are shared here so every page can report autosave
              problems in one consistent, visible location. */}
          {progressError && (
            <div className="alert alert-error" role="alert">
              {progressError}
            </div>
          )}
          {/* The current nested route is inserted inside the shared shell. */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
