# D1 Data Model Notes

Date: 2026-06-29
Status: Launch baseline

## What Goes In D1

D1 should store only mutable app state:

- users
- entitlements
- pending entitlements
- billing event audit rows
- bookmarks
- notes
- annotations
- collections
- share links
- export jobs
- lightweight analytics events

## What Does Not Go In D1

Do not store glossary content bodies in D1 for launch.

Reasons:

- public term reads are mostly static
- content belongs on the CDN path
- D1 should not become the bottleneck for browse/search traffic

## Plan Modeling

Use one product family with two billing modes:

- `subscription`
- `lifetime`

The recurring cadence should stay in Dodo plan/price configuration and mirrored in:

- `billing_mode`
- `provider_price_id`

The payment provider should stay explicit in app state:

- `billing_provider`
- `provider_customer_id`
- `provider_subscription_id`
- `provider_checkout_session_id`
- `provider_product_id`

The auth handoff should stay explicit too:

- payment events may arrive before an app user record exists
- `pending_entitlements` should hold recoverable commercial state until the first successful claim
- study-state routes should use the same app actor contract so bookmarks and notes do not need a second identity model

## Annotation Design

Annotations should attach to:

- `term_slug`
- `block_id`
- offsets

This is stronger than DOM-position anchoring and survives UI refactors better.

## Export Model

Exports should be asynchronous even if many finish quickly.

Why:

- keeps the route contract stable
- makes PDF or larger exports easier later
- lets R2 hold downloadable artifacts cleanly

## Analytics Philosophy

Do not overbuild product analytics at launch.

Track only:

- term view
- search
- bookmark create/remove
- note create/update
- checkout started
- checkout completed
- export requested/completed

That is enough to learn what the product is actually becoming.
