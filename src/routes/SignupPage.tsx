import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { isClerkEnabled } from "../auth/config";

const ClerkSignUp = isClerkEnabled
  ? lazy(() => import("@clerk/clerk-react").then(m => ({ default: m.SignUp })))
  : null;

export function SignupPage() {
  if (!isClerkEnabled) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <div className="section-header">
          <p className="eyebrow">Create account</p>
          <h2>Authentication is not configured in this environment yet.</h2>
          <p>
            Add the Clerk publishable key and Worker-side Clerk keys to enable production account creation.
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
        <p className="eyebrow">Create account</p>
        <h2>Open your private AI study workspace.</h2>
        <p>Create the learner identity that will hold your notes, entitlements, and long-term study memory.</p>
      </div>
      {ClerkSignUp ? (
        <article className="summary-card">
          <Suspense fallback={null}>
            <ClerkSignUp path="/signup" routing="path" signInUrl="/login" forceRedirectUrl="/pricing" />
          </Suspense>
        </article>
      ) : null}
      <article className="subtle-note">
        <p>
          Already have an account? <Link to="/login">Sign in here</Link>.
        </p>
      </article>
    </section>
    </DirectionalTransition>
  );
}
