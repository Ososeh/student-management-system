import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
const links = [
  { to: "/dashboard", label: "Dashboard", icon: "⌂" },
  { to: "/students", label: "Students", icon: "◉" },
  { to: "/courses", label: "Courses", icon: "▣" },
];
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
