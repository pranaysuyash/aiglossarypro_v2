import { lazy, Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./shell/AppLayout";
import { HomePage } from "./routes/HomePage";
import { CatalogProvider } from "./content/CatalogContext";
import { AppProvider } from "./platform/AppContext";
import { StudyProvider } from "./study/StudyContext";
import { CLERK_PUBLISHABLE_KEY, isClerkEnabled } from "./auth/config";
import "./styles.css";

const ClerkProviderBoundary = isClerkEnabled
  ? lazy(async () => {
      const module = await import("./auth/ClerkProviderBoundary");
      return { default: module.ClerkProviderBoundary };
    })
  : null;

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "pricing",
        lazy: async () => {
          const { PricingPage } = await import("./routes/PricingPage");
          return { Component: PricingPage };
        },
      },
      {
        path: "explore",
        lazy: async () => {
          const { ExplorePage } = await import("./routes/ExplorePage");
          return { Component: ExplorePage };
        },
      },
      {
        path: "families",
        lazy: async () => {
          const { FamiliesPage } = await import("./routes/FamiliesPage");
          return { Component: FamiliesPage };
        },
      },
      {
        path: "families/:familySlug",
        lazy: async () => {
          const { FamilyDetailPage } = await import("./routes/FamilyDetailPage");
          return { Component: FamilyDetailPage };
        },
      },
      {
        path: "paths",
        lazy: async () => {
          const { PathsPage } = await import("./routes/PathsPage");
          return { Component: PathsPage };
        },
      },
      {
        path: "paths/:pathSlug",
        lazy: async () => {
          const { PathDetailPage } = await import("./routes/PathDetailPage");
          return { Component: PathDetailPage };
        },
      },
      {
        path: "term/:slug",
        lazy: async () => {
          const { TermPage } = await import("./routes/TermPage");
          return { Component: TermPage };
        },
      },
      {
        path: "field-lab",
        lazy: async () => {
          const { FieldLabPage } = await import("./routes/FieldLabPage");
          return { Component: FieldLabPage };
        },
      },
      {
        path: "shared/:token",
        lazy: async () => {
          const { SharedTermPage } = await import("./routes/SharedTermPage");
          return { Component: SharedTermPage };
        },
      },
      {
        path: "saved",
        lazy: async () => {
          const { SavedPage } = await import("./routes/SavedPage");
          return { Component: SavedPage };
        },
      },
      {
        path: "notes",
        lazy: async () => {
          const { NotesPage } = await import("./routes/NotesPage");
          return { Component: NotesPage };
        },
      },
      {
        path: "account",
        lazy: async () => {
          const { AccountPage } = await import("./routes/AccountPage");
          return { Component: AccountPage };
        },
      },
      {
        path: "login",
        lazy: async () => {
          const { LoginPage } = await import("./routes/LoginPage");
          return { Component: LoginPage };
        },
      },
      {
        path: "signup",
        lazy: async () => {
          const { SignupPage } = await import("./routes/SignupPage");
          return { Component: SignupPage };
        },
      },
    ],
  },
]);

const appTree = (
  <StrictMode>
    <AppProvider>
      <CatalogProvider>
        <StudyProvider>
          <Suspense fallback={<div className="route-loading-shell">Loading screen…</div>}>
            <RouterProvider router={router} />
          </Suspense>
        </StudyProvider>
      </CatalogProvider>
    </AppProvider>
  </StrictMode>
);

createRoot(document.getElementById("root")!).render(
  isClerkEnabled && CLERK_PUBLISHABLE_KEY && ClerkProviderBoundary ? (
    <Suspense fallback={appTree}>
      <ClerkProviderBoundary publishableKey={CLERK_PUBLISHABLE_KEY}>{appTree}</ClerkProviderBoundary>
    </Suspense>
  ) : (
    appTree
  ),
);
