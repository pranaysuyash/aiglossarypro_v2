# AIGlossary v2 Technical Architecture

Date: 2026-06-29
Status: Recommended baseline

## Architecture Summary

Recommended deployment shape:

- one Cloudflare Worker application
- React Router full-stack frontend
- static asset pipeline for content packs
- D1 for user state
- R2 for versioned content/export artifacts
- Dodo Payments for billing
- external auth provider for launch

## Why This Is The Right Shape

The old project failed to get live because the system likely became more ambitious than the delivery path.

This architecture deliberately separates:

- content delivery
- user state
- billing/auth

That keeps the product scalable without making the first live version operationally fragile.

## Runtime Topology

```text
Browser
  -> Cloudflare Worker app
     -> static asset layer for search/content manifests
     -> API routes for user state and entitlements
     -> D1 for relational app data
     -> R2 for exports and content pack publishing
     -> Dodo payment events
     -> auth provider session validation
```

## Frontend Recommendation

Recommended stack:

- React
- React Router
- TypeScript
- CSS variables from day one
- component primitives, not page-local styling sprawl

Recommended route groups:

- `/`
- `/pricing`
- `/login`
- `/explore`
- `/term/:slug`
- `/paths`
- `/paths/:pathSlug`
- `/saved`
- `/notes`
- `/account`
- `/api/*`

## Content Storage Decision

### Use JSON for the knowledge layer

Yes, the public content should be JSON-first.

Recommended content artifacts:

- `terms/manifest.json`
- `terms/shards/a.json`
- `terms/shards/b.json`
- `paths/index.json`
- `paths/by-slug/advanced-architectures.json`
- `taxonomy/domains.json`
- `taxonomy/category-tree.json`
- `search/search-manifest.json`
- `search/shards/aa.json`

Recommended content publication strategies:

1. launch with versioned static assets bundled into the app build
2. move large packs to R2 only when editorial update frequency or asset size justifies it

Current build artifacts now include:

- `editorial/structure-registry.json`
- `editorial/launch-contract.json`

Why:

- `structure-registry.json` keeps the 295-field structure workbook classified and measurable
- `launch-contract.json` keeps the current launch subset explicit without forcing the app to render the whole editorial blueprint

Why static-first is better initially:

- simplest deploy story
- easiest rollback
- best CDN caching story
- no database reads for glossary traffic

Current consumer-facing use of the launch contract:

- the pricing surface previews `editorial/launch-contract.json`
- that keeps the membership pitch tied to the same compact runtime block set the app actually ships
- the structure workbook still remains the editorial blueprint behind the scenes

## Verified Sheet-to-Schema Mapping

Based on live sheet access:

- glossary inventory lives in the `main` tab of `AI ML DL terminologies`
- taxonomy fields are already present in glossary rows
- long-form structure guidance lives in the wide `Sheet2` template of `AI ML book structure`

That means the runtime data model should not be a one-to-one export of either source sheet.

Recommended transformation:

1. `main` tab -> canonical term records
2. `Sheet2` template -> editorial schema registry
3. normalized term JSON -> runtime content payload

## Recommended v1 Block Registry

Map the structure template into a bounded set of block types:

- `summary`
- `definition`
- `key_concepts`
- `why_it_matters`
- `prerequisites`
- `theory`
- `how_it_works`
- `variants`
- `applications`
- `implementation`
- `evaluation`
- `advantages_limitations`
- `ethics`
- `history`
- `related_terms`
- `further_reading`
- `faq`

All other structure-sheet fields should be preserved in the editorial superset but not required for the first production renderer.

## User Data Storage

Use D1 for:

- users
- auth-linked identities
- plan entitlements
- bookmarks
- notes
- annotation anchors
- share tokens
- export jobs

Recommended first-pass schema:

### `users`

- `id`
- `auth_provider`
- `auth_subject`
- `email`
- `created_at`
- `updated_at`

### `entitlements`

- `id`
- `user_id`
- `plan_family`
- `billing_mode`
- `status`
- `billing_provider`
- `provider_customer_id`
- `provider_subscription_id`
- `provider_checkout_session_id`
- `provider_product_id`
- `provider_price_id`
- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

### `bookmarks`

- `id`
- `user_id`
- `term_slug`
- `created_at`

### `notes`

- `id`
- `user_id`
- `term_slug`
- `title`
- `body_markdown`
- `visibility`
- `created_at`
- `updated_at`

### `annotations`

- `id`
- `user_id`
- `term_slug`
- `block_id`
- `start_offset`
- `end_offset`
- `selected_text`
- `note_id`
- `created_at`
- `updated_at`

### `share_links`

- `id`
- `user_id`
- `resource_type`
- `resource_id`
- `token`
- `visibility`
- `expires_at`
- `created_at`

## Annotation Model

Do not start with DOM-fragile client-only annotations.

Use structured anchors:

- `term_slug`
- `block_id`
- `start_offset`
- `end_offset`

This lets the content renderer evolve without breaking every saved annotation.

## Search Architecture

Recommended launch strategy:

- normalize terms, aliases, abbreviations, and category paths at build time
- generate compact search shards
- query them in a Web Worker
- rank exact title match above alias match above body hit

Why this beats a live DB search at launch:

- faster perceived performance
- lower infra cost
- no runtime coupling between public search and user tables
- easier offline-ish caching

## Auth Architecture

Recommended launch stance:

- do not build custom auth
- choose a proven auth provider
- store app-side user records and entitlements in D1

Recommended provider:

- Clerk

Adapter boundary:

- `auth/session.server.ts`
- `auth/provider.server.ts`
- `auth/user-sync.server.ts`

This keeps a future provider swap possible.

## Billing Architecture

Recommended Dodo product shape:

- product family `AIGlossary Pro`
- recurring plan `monthly`
- recurring plan `yearly`
- one-time purchase `lifetime`

Webhook-driven entitlement sync:

1. checkout complete
2. payment event validates event origin
3. entitlement row upserted in D1
4. user session reads entitlement
5. gated routes/components unlock

Important rule:

- the app should trust its own `entitlements` table after verified webhook processing, not ad-hoc client payment state
- the app should keep webhook durability separate from account-link timing

Claiming model:

1. Dodo webhook arrives
2. app verifies signature
3. app stores durable `billing_events` audit row
4. app stores or updates `pending_entitlements` by customer email
5. after login, app claims matching pending entitlements into `entitlements`

## Sharing and Export

Recommended launch scope:

- public canonical term links
- private notes export to Markdown and JSON
- optional share token for user-approved public note snapshot

Recommended export flow:

1. user requests export
2. Worker generates export bundle
3. bundle written to R2
4. signed download or direct gated download returned

## Observability

Track:

- search queries
- term views
- bookmark creation
- note saves
- export requests
- checkout starts
- checkout completion
- entitlement mismatch failures
- webhook failures

Minimum operator visibility:

- failed webhook dashboard
- export job status
- auth sync failures
- content pack version currently active

## Caching

Public content:

- aggressive CDN caching
- immutable versioned asset URLs

User APIs:

- no shared cache
- session-aware responses

## Recommended Repo Structure

```text
app/
  routes/
  components/
  features/
  lib/
  styles/
workers/
  api/
  billing/
  auth/
  claims/
content/
  source/
  normalized/
  published/
Docs/
tools/
tests/
```

## Risk Notes

### Low risk

- static JSON content delivery
- D1 for bookmarks/notes/entitlements at this scale
- Dodo-hosted checkout

### Medium risk

- taxonomy quality from raw sheet data
- duplicate term reconciliation
- annotation anchor durability if content transforms too much

### High risk

- trying to collapse auth, billing, editorial tooling, and search infra into one overly custom system before launch

## Recommended Delivery Sequence

1. content profiling
2. schema lock
3. frontend shell
4. auth
5. Dodo checkout + entitlements
6. entitlement claiming after login
7. bookmarks + notes
8. exports
9. editorial import automation
