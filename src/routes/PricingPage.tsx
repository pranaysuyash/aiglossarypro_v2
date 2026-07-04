import { SignInButton, SignedOut } from "@clerk/clerk-react";
import { startTransition, useState } from "react";
import { isClerkEnabled } from "../auth/config";
import { useAppState } from "../platform/AppContext";
import { useWorkerRequest } from "../platform/workerApi";
import { LaunchCurriculumPreview } from "../components/LaunchCurriculumPreview";

const planDetails: Record<string, string> = {
  "pro-subscription":
    "Best for active learners who want ongoing access, expanding coverage, and continuous updates.",
  "pro-lifetime":
    "Best for committed learners who want permanent access without recurring billing.",
};

const membershipPromises = [
  "Full glossary access across the evolving AI/ML/DL catalog",
  "Private notebook, annotations, bookmarks, and exportable study memory",
  "A paid product shaped for serious learners, not ad funnels or free-tier upsells",
];

const membershipSignals = [
  {
    title: "Study continuity",
    body: "Your saved concepts, notes, and exports stay attached to the same learner identity.",
  },
  {
    title: "Content depth",
    body: "The corpus stays JSON-first, structured, and expandable without turning into a CMS project.",
  },
  {
    title: "Commercial clarity",
    body: "Exactly two paid plans keeps the membership message calm, honest, and easy to choose.",
  },
];

const planHighlights = [
  {
    title: "Subscription",
    body: "Best for active learners who want ongoing coverage and updates.",
    badge: "monthly / yearly",
  },
  {
    title: "Lifetime",
    body: "Best for committed learners who want to pay once and keep the library.",
    badge: "one-time",
  },
];

export function PricingPage() {
  const { plans, session, isLoading, serviceHealth, error, source, fallbackReason } = useAppState();
  const apiRequest = useWorkerRequest();
  const [checkoutState, setCheckoutState] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCheckout =
    Boolean(
      session?.authenticated &&
        serviceHealth?.capabilities.clerkConfigured &&
        serviceHealth?.capabilities.d1Configured &&
        serviceHealth?.capabilities.dodoBillingConfigured &&
        !isSubmitting,
    ) && isClerkEnabled;

  async function startCheckout(planKey: string, billingMode: "monthly" | "yearly" | "lifetime") {
    setIsSubmitting(true);
    setCheckoutState(null);

    try {
      const payload = await apiRequest<{ checkout?: { checkoutUrl?: string }; error?: string }>(
        "/api/billing/checkout",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            planKey,
            billingMode,
            successUrl: `${window.location.origin}/account?checkout=success`,
            cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
          }),
        },
      );

      if (!payload.checkout?.checkoutUrl) {
        throw new Error(payload.error ?? "Checkout session could not be created.");
      }

      window.location.assign(payload.checkout.checkoutUrl);
    } catch (checkoutError) {
      startTransition(() => {
        setCheckoutState(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Checkout session could not be created.",
        );
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-grid">
      <section className="pricing-intake">
        <article className="hero-card pricing-hero">
          <p className="eyebrow">Membership</p>
          <h2>One product. Two ways in. No bait-and-switch tier maze.</h2>
          <p>
            AIGlossary Pro should feel like a premium learning membership, not a feature matrix puzzle.
            Choose the pace that fits you: ongoing membership or a permanent seat at the table.
          </p>
          <div className="shelf-links">
            <span>Monthly or yearly</span>
            <span>Lifetime access</span>
            <span>No free plan</span>
          </div>
        </article>
        <article className="summary-card summary-emphasis pricing-billboard">
          <p className="showcase-label">What membership buys</p>
          <h3>A living AI field guide plus a private study system.</h3>
          <ul>
            {membershipPromises.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="term-metrics">
            Membership also helps protect the richer featured deep dives, path-level curation, and the editorial tiering that keeps the corpus from flattening into one-size-fits-all content.
          </p>
        </article>
      </section>
      <section className="workspace-hero">
        <article className="summary-card">
          <p className="showcase-label">Who this is for</p>
          <h3>People who want fluency, not just exposure.</h3>
          <p>
            If you keep saving papers, tweets, tutorials, and product notes but still want a
            cleaner way to retain the language of the field, this is the product surface you&apos;re paying for.
          </p>
        </article>
      </section>
      <LaunchCurriculumPreview />
      {checkoutState ? (
        <article className="summary-card">
          <h3>Checkout response</h3>
          <p>{checkoutState}</p>
        </article>
      ) : null}
      {source === "unavailable" ? (
        <article className="subtle-note">
          <p>
            The Worker commerce/auth surface is unavailable right now, so this page is showing the
            canonical plan shape while account-bound checkout remains blocked. Last Worker read error: {fallbackReason}.
          </p>
        </article>
      ) : null}
      {session?.authenticated && serviceHealth && !serviceHealth.capabilities.dodoBillingConfigured ? (
        <article className="subtle-note">
          <p>Checkout is paused because Dodo checkout credentials or product IDs are not fully configured.</p>
        </article>
      ) : null}
      {session?.authenticated && serviceHealth && !serviceHealth.capabilities.d1Configured ? (
        <article className="subtle-note">
          <p>Checkout integrity and account-sync both require D1; this deployment has no D1 binding.</p>
        </article>
      ) : null}
      {!session?.configured ? (
        <article className="subtle-note">
          <p>
            Checkout is wired for Dodo Payments, but this environment does not yet have the Clerk
            keys required for a real sign-in and account-bound payment flow.
          </p>
        </article>
      ) : null}
      {session?.configured && !session?.authenticated ? (
        <article className="summary-card">
          <h3>Sign in before purchase</h3>
          <p>
            Paid access should attach directly to your learner identity so bookmarks, notes, and entitlements stay synchronized.
          </p>
          {isClerkEnabled ? (
            <SignedOut>
              <SignInButton mode="modal">
                <button className="primary-button" type="button">Sign In To Continue</button>
              </SignInButton>
            </SignedOut>
          ) : null}
        </article>
      ) : null}
      {isLoading ? (
        <article className="summary-card">
          <h3>Loading plans</h3>
          <p>Reading the live commercial plan configuration from the Worker.</p>
        </article>
      ) : error && source === "unavailable" ? (
        <article className="summary-card">
          <h3>Live account services unavailable</h3>
          <p>{error}</p>
        </article>
      ) : (
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.key}
              className={`pricing-card ${plan.key === "pro-lifetime" ? "pricing-featured" : ""}`}
            >
              <p className="eyebrow">{plan.key === "pro-lifetime" ? "Lifetime access" : "Subscription"}</p>
              <h3>{plan.priceDisplay}</h3>
              <p>{planDetails[plan.key]}</p>
              <ul>
                {plan.featureAccess.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className="pricing-note">
                {plan.key === "pro-lifetime"
                  ? "Pay once for permanent access to the same learning system."
                  : "Stay current as the corpus expands and the study system grows."}
              </p>
              <div className="hero-actions">
                {plan.billingOptions.map((billingMode) => (
                  <button
                    key={billingMode}
                    className="primary-button"
                    disabled={!canCheckout}
                    onClick={() => startCheckout(plan.key, billingMode)}
                    type="button"
                  >
                    {isSubmitting ? "Preparing checkout" : `Choose ${billingMode}`}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      <section className="pricing-intake">
        {membershipSignals.map((signal) => (
          <article key={signal.title} className="summary-card">
            <p className="showcase-label">{signal.title}</p>
            <h3>{signal.body}</h3>
          </article>
        ))}
      </section>
      <section className="workspace-hero">
        {planHighlights.map((item) => (
          <article key={item.title} className="summary-card">
            <p className="showcase-label">{item.badge}</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>
      <section className="workspace-hero">
        <article className="summary-card">
          <p className="showcase-label">Why no free plan</p>
          <h3>This should feel like a member-backed learning product.</h3>
          <p>
            The commercial model is intentionally simple so the app can optimize for depth,
            calmness, and serious study behavior instead of free-tier growth loops.
          </p>
        </article>
        <article className="summary-card">
          <p className="showcase-label">What happens after checkout</p>
          <h3>Your study memory becomes account-bound.</h3>
          <p>
            Membership should unlock synced bookmarks, notes, annotations, share links, and
            exports across devices through the same signed-in identity used at checkout.
          </p>
        </article>
      </section>
    </section>
  );
}
