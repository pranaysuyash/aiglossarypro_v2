import { useEffect, useState } from "react";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { loadPublishedCorpusManifest, type PublishedCorpusManifest } from "../content/publishedManifest";
import { useAppState } from "../platform/AppContext";

export function AccountPage() {
  const { session, activeEntitlement, hasActiveMembership, isLoading, error, source, fallbackReason, serviceHealth } = useAppState();
  const [manifest, setManifest] = useState<PublishedCorpusManifest | null>(null);
  const isConfigured = session?.configured ?? false;
  const isAuthenticated = session?.authenticated ?? false;
  const capabilities = serviceHealth?.capabilities;
  const quickQuizCount = manifest?.contentDepth?.blockCounts["quick-quiz"] ?? 0;
  const deepDiveCount = manifest?.contentDepth?.blockCounts["deep-dive"] ?? 0;

  useEffect(() => {
    let isCancelled = false;

    async function loadManifest() {
      const payload = await loadPublishedCorpusManifest();
      if (!isCancelled) {
        setManifest(payload);
      }
    }

    void loadManifest();
    return () => {
      isCancelled = true;
    };
  }, []);

  const accountSignals = [
    {
      label: "Identity",
      value: isAuthenticated ? "Signed in" : "Preview",
    },
    {
      label: "Membership",
      value: hasActiveMembership ? "Active" : "Not active",
    },
    {
      label: "Sync",
      value: capabilities?.d1Configured ? "Account-backed" : "Worker preview",
    },
  ];

  return (
    <DirectionalTransition>
    <section className="page-grid">
      <div className="section-header">
        <p className="eyebrow">Profile</p>
        <h2>Your membership should protect your study continuity.</h2>
        <p>
          This is where identity, membership, and saved learning state meet. The product should
          feel like your private study room follows you everywhere you sign in.
        </p>
      </div>
      {isLoading ? (
        <article className="summary-card">
          <h3>Loading your member space…</h3>
          <p>Reading the live identity and continuity surface from the Worker.</p>
        </article>
      ) : error && source === "unavailable" ? (
        <article className="summary-card">
          <h3>Member space syncing</h3>
          <p>{error}</p>
        </article>
      ) : (
        <section className="workspace-hero">
          <article className="summary-card">
            <p className="showcase-label">Account state</p>
            <h3>{isAuthenticated ? "Member identity active" : "Preview mode"}</h3>
            <p>
              Identity provider: {session?.provider ?? "clerk"}.
              {isConfigured
                ? " Login and session handling are ready in this environment."
                : " The auth provider is not fully configured in this environment yet."}
            </p>
            {session?.user ? <p>Signed in as {session.user.email}.</p> : null}
            {capabilities ? (
              <div className="shelf-links">
                <span>{capabilities.clerkConfigured ? "Auth ready" : "Auth pending"}</span>
                <span>{capabilities.d1Configured ? "D1 ready" : "D1 pending"}</span>
                <span>{capabilities.dodoBillingConfigured ? "Dodo ready" : "Dodo pending"}</span>
              </div>
            ) : null}
            <div className="note-snippet-list">
              {accountSignals.map((signal) => (
                <span key={signal.label}>
                  {signal.label}: {signal.value}
                </span>
              ))}
            </div>
          </article>
          <article className="summary-card">
            <p className="showcase-label">Why this matters</p>
            <h3>Your notes and saved concepts should follow the learner, not the browser.</h3>
            <p>
              Membership value grows when the notebook, annotations, exports, and entitlements stay attached to the learner account.
            </p>
            <div className="path-row">
              <span>Bookmarks</span>
              <span>Notes</span>
              <span>Exports</span>
              <span>Share links</span>
            </div>
          </article>
        </section>
      )}
      {source === "unavailable" ? (
        <article className="subtle-note">
          <p>
            The member surface is unavailable right now, so this page cannot verify live identity,
            entitlements, or synced study state. Last Worker read error: {fallbackReason}.
          </p>
        </article>
      ) : null}
      <div className="card-grid">
        <article className="summary-card">
          <p className="showcase-label">Identity</p>
          <h3>Member access</h3>
          <p>Use the external auth provider at launch, then mirror learner records into D1.</p>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Membership</p>
          <h3>Your plan</h3>
          <p>
            {hasActiveMembership && activeEntitlement
              ? `Active ${activeEntitlement.billingMode} membership in the ${activeEntitlement.planFamily} plan family.`
              : "No active membership has been attached to this account yet."}
          </p>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Continuity</p>
          <h3>Study sync</h3>
          <p>Bookmarks, notes, collections, share links, and exports become account-bound state.</p>
        </article>
      </div>
      <section className="workspace-hero">
        <article className="summary-card">
          <p className="showcase-label">Corpus depth</p>
          <h3>{manifest ? `${manifest.contentTierCounts.featured ?? 0} featured deep dives` : "Loading corpus depth…"}</h3>
          <p>
            Membership protects the full corpus, but the best terms get extra editorial depth so the library feels curated instead of flat.
          </p>
            <div className="shelf-links">
              <span>{manifest ? `${manifest.contentTierCounts.standard ?? 0} standard terms` : "Standard terms"}</span>
              <span>{manifest ? `${manifest.contentTierCounts.sparse ?? 0} sparse long-tail terms` : "Sparse long tail"}</span>
              <span>{manifest ? `${manifest.coverage.blockCoverage["study-prompts"]} study prompts` : "Study prompts"}</span>
              <span>{manifest ? `${quickQuizCount} quick quizzes` : "Quick quizzes"}</span>
              <span>{manifest ? `${deepDiveCount} featured deep dives` : "Featured deep dives"}</span>
            </div>
          </article>
        <article className="summary-card">
          <p className="showcase-label">Plan logic</p>
          <h3>Two paid paths, one learning system.</h3>
          <p>
            The subscription plan fits active learners who want ongoing updates; the lifetime plan fits people who want permanent access without recurring billing.
          </p>
          <div className="path-row">
            <span>Subscription</span>
            <span>Lifetime</span>
            <span>No free tier</span>
          </div>
        </article>
      </section>
      <article className="subtle-note">
        <p>
          Implemented now: Clerk-backed session UI path, Worker session verification surface,
          Dodo checkout-to-entitlement wiring, and D1-backed study sync for authenticated users.
          Remaining external requirement: production keys and bindings in the target Cloudflare environment.
        </p>
      </article>
    </section>
    </DirectionalTransition>
  );
}
