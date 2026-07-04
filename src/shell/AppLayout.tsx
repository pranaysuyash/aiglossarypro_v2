import { lazy, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { isClerkEnabled } from "../auth/config";

const HeaderAuthControls = isClerkEnabled
  ? lazy(async () => {
      const module = await import("./HeaderAuthControls");
      return { default: module.HeaderAuthControls };
    })
  : null;

const links = [
  { to: "/", label: "Discover" },
  { to: "/field-lab", label: "Field Lab" },
  { to: "/explore", label: "Library" },
  { to: "/families", label: "Families" },
  { to: "/paths", label: "Paths" },
  { to: "/pricing", label: "Pricing" },
  { to: "/saved", label: "Saved" },
  { to: "/notes", label: "Notebook" },
  { to: "/account", label: "Profile" },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span>AG</span>
          </div>
          <div>
            <p className="eyebrow">AIGlossary Pro</p>
            <h1 className="site-title">The AI field guide you grow into.</h1>
          </div>
        </div>
        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-cta">
          <p>One subscription. One lifetime pass. Routes, features, and corpus depth all visible.</p>
          {isClerkEnabled && HeaderAuthControls ? (
            <Suspense fallback={<button className="primary-button" type="button">Sign In</button>}>
              <HeaderAuthControls />
            </Suspense>
          ) : (
            <NavLink className="primary-button" to="/pricing">
              Unlock Full Access
            </NavLink>
          )}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>AIGlossary Pro turns scattered AI terminology into a learning habit you can actually keep.</p>
      </footer>
    </div>
  );
}
