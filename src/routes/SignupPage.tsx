import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { isClerkEnabled } from "../auth/config";

export function SignupPage() {
  if (!isClerkEnabled) {
    return (
      <section className="page-grid">
        <div className="section-header">
          <p className="eyebrow">Create account</p>
          <h2>Authentication is not configured in this environment yet.</h2>
          <p>
            Add the Clerk publishable key and Worker-side Clerk keys to enable production account creation.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="section-header">
        <p className="eyebrow">Create account</p>
        <h2>Open your private AI study workspace.</h2>
        <p>Create the learner identity that will hold your notes, entitlements, and long-term study memory.</p>
      </div>
      <article className="summary-card">
        <SignUp path="/signup" routing="path" signInUrl="/login" forceRedirectUrl="/pricing" />
      </article>
      <article className="subtle-note">
        <p>
          Already have an account? <Link to="/login">Sign in here</Link>.
        </p>
      </article>
    </section>
  );
}
