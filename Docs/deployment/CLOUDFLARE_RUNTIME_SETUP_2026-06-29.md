# Cloudflare Runtime Setup

Date: 2026-06-29
Status: Required for live auth, billing, and synced study state

## Goal

Make the current Worker contract actually deployable on Cloudflare without hidden environment assumptions.

## Required Runtime Inputs

### D1

- canonical Worker binding name: `DB`
- canonical schema source: `infra/d1/schema.sql`
- canonical migrations directory: `infra/d1/migrations`

Create the database and keep the returned `database_id` for `wrangler.jsonc`:

```bash
npx wrangler d1 create aiglossary-v2
```

Then replace `<cloudflare-d1-database-id>` under `d1_databases` in [wrangler.jsonc](/Users/pranay/Projects/aiglossary_v2/wrangler.jsonc).

Apply migrations:

```bash
npm run cf:d1:migrate:local
npm run cf:d1:migrate:remote
```

For non-production local dev in `wrangler dev`, keep the same `d1_databases` block in place and rely on the local D1 simulation managed by Wrangler:

```bash
npm run cf:d1:migrate:local
```

### Clerk

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- optional `CLERK_JWT_KEY` (used only to verify token key rotation where supported)
- optional `CLERK_AUTHORIZED_PARTIES`

### Dodo Payments

- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_ENVIRONMENT`
- `DODO_PAYMENTS_WEBHOOK_KEY`
- `DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY`
- `DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY`
- `DODO_PAYMENTS_PRODUCT_ID_LIFETIME`

Local example values live in [.dev.vars.example](/Users/pranay/Projects/aiglossary_v2/.dev.vars.example).

## Runtime Behavior Now

- `/api/auth/session` now upserts the signed-in user into D1 and auto-claims any matching pending entitlements by email before returning the session payload
- `/api/billing/webhook` now fails fast when D1 is absent instead of pretending the event persisted
- Dodo webhook events now map onto stable logical entitlement ids:
  - subscriptions use `subscription:<subscription_id>`
  - one-time purchases use `payment:<payment_id>`
  - checkout/session/event ids are only fallback identities

This prevents subscription lifecycle events from creating duplicate entitlements for one real purchase.

## Known External Blockers

- this local shell is not logged into Cloudflare right now, so the actual `database_id` still has to be created in an authenticated terminal
- `wrangler dev` is now runnable locally; runtime proof for `/api/*` requires live credentials/bindings and then can be exercised end-to-end in local simulation.

## Verification Pass Notes

Ran locally with real `wrangler` runtime during this pass:

- `GET /api/health` and `GET /api/plans` return valid JSON
- `POST /api/billing/checkout` returns `401` without session and returns 502/503 only when session/binding/auth credentials are intentionally missing
- `/api/bookmarks`, `/api/notes`, `/api/annotations`, `/api/share-links`, `/api/entitlements`, and `/api/exports` reject unauthenticated callers as expected
- `POST /api/billing/webhook` returns `401` with invalid payload and `503` when webhook key is not configured, proving signature guard and D1 dependency checks are active

Known remaining blockers for production flow:

- set real `wrangler.jsonc` `d1_databases[0].database_id`
- configure production Clerk keys in Worker environment
- configure production Dodo credentials (`*_API_KEY`, `*_WEBHOOK_KEY`, product ids)
