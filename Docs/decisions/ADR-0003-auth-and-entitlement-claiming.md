# ADR-0003: Auth and Entitlement Claiming

Date: 2026-06-29
Status: Accepted
Owner: Codex implementation pass

## Decision

Use Clerk as the first live auth provider for AIGlossary v2, and keep entitlement claiming separate from authentication.

That means:

- Clerk owns sign-in, session handling, recovery, and identity UX
- AIGlossary owns the app-side user record and entitlement state in D1
- Dodo payment events can create `pending_entitlements` before a user account is linked
- after sign-in, the app can claim any matching pending entitlements by email and convert them into user-bound entitlements

## Why This Is The Right Shape

This product is content-heavy and revenue-backed, not auth-differentiated.

The first-principles failure to avoid is coupling payment completion to perfect auth timing. If a user pays before the app account is fully linked, the entitlement should still exist and remain recoverable.

## Options Considered

### Option A: Build custom auth in the Worker

Pros:

- maximum ownership

Cons:

- unnecessary security burden
- slower path to reliable launch
- distracts from the real product wedge

Decision: rejected

### Option B: Use Clerk plus app-side entitlement claiming

Pros:

- fastest reliable route to production login
- strong React and edge tooling
- keeps session UX out of the critical path
- decouples billing completion from auth timing edge cases

Cons:

- external vendor dependency
- requires explicit app-side claim logic

Decision: accepted

## Consequences

### Positive

- login can be production-grade without custom auth debt
- payments remain durable even if account linkage happens later
- D1 stays the app-side source of truth for entitlements

### Tradeoffs

- the claim path needs careful implementation and testing
- until Clerk keys are configured, the app stays in pre-auth mode

## Validation Plan

1. configure Clerk publishable and secret keys in the Worker environment
2. implement `/api/auth/session` against real Clerk sessions
3. implement claim-on-login flow from `pending_entitlements` to `entitlements`
4. verify happy path, retry path, and duplicate webhook path

## Implementation Update (2026-06-29)

- `/api/auth/session` now resolves real Clerk-backed sessions, mirrors the user into D1, and auto-claims matching pending entitlements before returning account state
- Dodo webhook ingestion now persists against stable logical entitlement ids so subscription lifecycle events update one entitlement record instead of creating one row per webhook event
- remaining live blocker is environment setup: Cloudflare `DB` binding plus production Clerk/Dodo values
- `/api/auth/session` now requires a complete server auth posture (`CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`) before exposing configured auth state to the app, preventing false-positive “configured” status
