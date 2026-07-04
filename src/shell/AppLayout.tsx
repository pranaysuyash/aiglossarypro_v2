import { lazy, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { isClerkEnabled } from "../auth/config";
import { useNavigationDirection } from "../hooks/useNavigationDirection";

const HeaderAuthControls = isClerkEnabled
  ? lazy(async () => {
      const module = await import("./HeaderAuthControls");
      return { default: module.HeaderAuthControls };
    })
  : null;

const links = [
  { to: "/", label: "Discover" },
  { to: "/explore", label: "Library" },
  { to: "/families", label: "Families" },
  { to: "/paths", label: "Paths" },
  { to: "/pricing", label: "Pricing" },
  { to: "/saved", label: "Saved" },
  { to: "/notes", label: "Notebook" },
  { to: "/account", label: "Profile" },
];

export function AppLayout() {
  const { push } = useNavigationDirection();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header" style={{ viewTransitionName: "site-header" } as React.CSSProperties}>
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
              onClick={(e) => {
                e.preventDefault();
                push(link.to);
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-cta">
          <p>One subscription. One lifetime pass to the whole library.</p>
          {isClerkEnabled && HeaderAuthControls ? (
            <Suspense fallback={<button className="primary-button" type="button">Sign In</button>}>
              <HeaderAuthControls />
            </Suspense>
          ) : (
            <NavLink
              className="primary-button"
              to="/pricing"
              onClick={(e) => {
                e.preventDefault();
                push("/pricing");
              }}
            >
              Unlock Full Access
            </NavLink>
          )}
        </div>
      </header>
      <main className="main-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer" style={{ viewTransitionName: "site-footer" } as React.CSSProperties}>
        <p>AIGlossary Pro turns scattered AI terminology into a learning habit you can actually keep.</p>
      </footer>
    </div>
  );
}
