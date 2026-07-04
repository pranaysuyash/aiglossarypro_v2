# ADR-0002: Dodo Payments Billing Architecture

Date: 2026-06-29
Status: Accepted
Owner: Codex implementation pass

## Decision

Use Dodo Payments as the billing provider for AIGlossary v2.

The app-side contract should stay provider-aware but provider-neutral in schema naming:

- `billing_provider`
- `provider_customer_id`
- `provider_subscription_id`
- `provider_checkout_session_id`
- `provider_product_id`
- `provider_price_id`

## Context

The product requires exactly two commercial choices:

- a subscription product with monthly and yearly billing options
- a lifetime purchase

The user explicitly chose Dodo Payments and asked that the fresh product not inherit accidental assumptions from the older effort.

## Options Considered

### Option A: Keep the earlier provider-specific assumptions from the first planning pass

Pros:

- already documented in the initial architecture notes

Cons:

- conflicts with the user’s explicit provider choice
- bakes provider-specific naming into the schema too early
- creates avoidable migration churn

Decision: rejected

### Option B: Use Dodo Payments with provider-neutral entitlement fields

Pros:

- aligns with the chosen provider
- keeps the billing layer adaptable
- supports subscription and lifetime products cleanly
- keeps webhook-driven entitlement sync straightforward

Cons:

- requires replacing the earlier provider-specific naming and docs

Decision: accepted

## Consequences

### Positive

- the payment architecture now matches the actual product decision
- the schema avoids an unnecessary provider-shaped source of truth
- the Worker billing surface can be built around hosted checkout plus payment events

### Tradeoffs

- older notes created earlier in the day needed correction
- event mapping is now implemented in Worker routes with claimable pending-to-bound entitlements and stable entitlement IDs

## Validation Plan

1. verify Dodo-hosted checkout flow and API terminology against the official docs
2. implement Worker billing routes and webhook signature verification
3. persist Dodo-originated entitlement state into D1
4. test subscription purchase, lifetime purchase, renewal, and cancellation handling

## Revisit Triggers

Revisit this ADR if:

- Dodo product primitives change materially
- the user chooses a different billing provider
- the product adds team billing or enterprise invoicing that changes the entitlement model

## Addendum (2026-06-29T21:10:00+05:30)

### Decision

Add a production-readiness gate on checkout and expose service capability flags from `/api/health`:

- `/api/health` now reports clerk, D1, and Dodo readiness.
- `/api/billing/checkout` now returns 503 when `DB` or Dodo checkout credentials/product IDs are unavailable.
- Billing configuration checks are now non-throwing when evaluating readiness (`resolveDodoConfiguration`) so capability telemetry never fails the health surface.

### Outcome

- This prevents half-configured environments from exposing a partially wired premium path.
- Frontend behavior can now surface specific reasons for blocked checkout without assuming missing user attribution.
