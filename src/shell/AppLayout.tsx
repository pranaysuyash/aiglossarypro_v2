import { lazy, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isClerkEnabled } from "../auth/config";
import { useNavigationDirection } from "../hooks/useNavigationDirection";
import { useTheme } from "../components/providers/theme-provider";
import { useAppState } from "../platform/AppContext";

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
  { to: "/review", label: "Review" },
  { to: "/notes", label: "Notebook" },
  { to: "/account", label: "Profile" },
];

function PaletteToggle() {
  const { palette, setPalette } = useTheme();
  const isWarm = palette === "warm";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="palette-toggle"
            onClick={() => setPalette(isWarm ? "slate" : "warm")}
            aria-label={`Switch to ${isWarm ? "dark" : "light"} mode`}
          >
            {isWarm ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{`Switch to ${isWarm ? "dark" : "light"} mode`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AppLayout() {
  const { push } = useNavigationDirection();
  const { session } = useAppState();
  const isAuthenticated = Boolean(session?.authenticated);

  return (
    <div className={isAuthenticated ? "app-shell app-shell-authenticated" : "app-shell"}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      {isAuthenticated ? null : (
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
            <PaletteToggle />
            <p>One subscription. One lifetime pass to the whole library.</p>
            {isClerkEnabled && HeaderAuthControls ? (
              <Suspense fallback={<Button variant="accent" size="md">Sign In</Button>}>
                <HeaderAuthControls />
              </Suspense>
            ) : (
              <Button variant="accent" size="md" asChild>
                <NavLink
                  to="/pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    push("/pricing");
                  }}
                >
                  Unlock Full Access
                </NavLink>
              </Button>
            )}
          </div>
        </header>
      )}
      <main className="main-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      {isAuthenticated ? null : (
        <footer className="site-footer" style={{ viewTransitionName: "site-footer" } as React.CSSProperties}>
          <p>AIGlossary Pro turns scattered AI terminology into a learning habit you can actually keep.</p>
        </footer>
      )}
    </div>
  );
}
