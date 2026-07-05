import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { isClerkEnabled } from "../auth/config";

const ClerkSignIn = isClerkEnabled
  ? lazy(() => import("@clerk/clerk-react").then(m => ({ default: m.SignIn })))
  : null;

export function LoginPage() {
  if (!isClerkEnabled) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <div className="section-header">
          <p className="eyebrow">Login</p>
          <h2>Authentication is not configured in this environment yet.</h2>
          <p>
            Add `VITE_CLERK_PUBLISHABLE_KEY` on the frontend and the matching Clerk server
            keys on the Worker to enable real sign-in.
          </p>
        </div>
      </section>
      </DirectionalTransition>
    );
  }

  return (
    <DirectionalTransition>
    <section className="page-grid">
      <div className="section-header">
        <p className="eyebrow">Login</p>
        <h2>Sign in to turn your study memory into account-bound state.</h2>
        <p>Bookmarks, notes, annotations, exports, and paid access all anchor to your learner account.</p>
      </div>
      {ClerkSignIn ? (
        <article className="summary-card">
          <Suspense fallback={null}>
            <ClerkSignIn path="/login" routing="path" signUpUrl="/signup" forceRedirectUrl="/account" />
          </Suspense>
        </article>
      ) : null}
      <article className="subtle-note">
        <p>
          New here? <Link to="/signup">Create your member account</Link>.
        </p>
      </article>
    </section>
    </DirectionalTransition>
  );
}
