# Discovery Log

Date: 2026-06-29
Scope: initial planning, architecture, data-access check, and deployment research

## Repo Ground Truth

- cwd: `/Users/pranay/Documents/aiglossary_v2`
- repo state: initialized git repository with no commits
- notable local files at start:
  - `.git/*`
  - `mcp-shell.log`
- no repo-local `AGENTS.md`
- no repo-local `CLAUDE.md`
- no project-local `motto_v3.md`

## Instruction Sources Read

1. `/Users/pranay/AGENTS.md`
2. `/Users/pranay/Projects/AGENTS.md`
3. `/Users/pranay/Projects/agent-start` (read as a script reference because this repo is outside `/Users/pranay/Projects`)
4. local skills:
   - `/Users/pranay/Projects/skills/frontend-design/SKILL.md`
   - `/Users/pranay/Projects/skills/frontend-patterns/SKILL.md`
   - `/Users/pranay/Projects/skills/deployment-patterns/SKILL.md`

## Data Access Attempts

Attempted direct CSV export for both Google Sheets tabs:

1. `https://docs.google.com/spreadsheets/d/1dwxPpJOKz-z_nqxl0kpLHWmMwv7jp_Z04LRGpWyfgF8/export?format=csv&gid=1949013657`
2. `https://docs.google.com/spreadsheets/d/1jKc59lYnol9KKWrpYNOYxgqWnze5MTSsR5AhV3ztOgQ/export?format=csv&gid=1740100535`

Observed result:

- Google returned a login/cookie access HTML page instead of CSV
- conclusion: the sheets are not anonymously readable from this environment

Later update:

- after Google Drive connector access was enabled, live spreadsheet reads succeeded
- this removed the immediate planning blocker for structural inspection
- anonymous export is still unavailable, so committed CSV snapshots remain useful for repeatable offline processing

## Exact Commands Run

```bash
pwd
ls -la
rg --files -g 'AGENTS.md' -g 'CLAUDE.md' -g 'motto_v3.md' -g 'motto_v2.md' .
sed -n '1,220p' /Users/pranay/AGENTS.md
sed -n '1,260p' /Users/pranay/Projects/AGENTS.md
file /Users/pranay/Projects/agent-start
sed -n '1,220p' /Users/pranay/Projects/agent-start
git status --short
git branch --show-current
git log --oneline --decorate -5
curl -L 'https://docs.google.com/spreadsheets/d/1dwxPpJOKz-z_nqxl0kpLHWmMwv7jp_Z04LRGpWyfgF8/export?format=csv&gid=1949013657'
curl -L 'https://docs.google.com/spreadsheets/d/1jKc59lYnol9KKWrpYNOYxgqWnze5MTSsR5AhV3ztOgQ/export?format=csv&gid=1740100535'
date '+%Y-%m-%d %H:%M:%S %Z'
git remote -v
```

## Research Questions

1. Can AIGlossary v2 stay mostly JSON-first for content while still supporting paid user features?
2. Which Cloudflare primitives should hold content vs user data?
3. What is the least complicated launch architecture that still scales?
4. What monetization model best matches “monthly/yearly + lifetime only”?
5. How do we keep the previous overcomplication from repeating?

## Verified Sheet Findings

### Glossary sheet

- spreadsheet: `AI ML DL terminologies`
- main tab row count: `21,593`
- main tab column count: `32`
- column `A` is the primary term inventory
- columns `N:P` are a validated taxonomy strip:
  - `topic`
  - `category`
  - `sub category`

### Structure sheet

- spreadsheet: `AI ML book structure`
- `Sheet2` row count: `1,000`
- `Sheet2` column count: `689`
- the sheet is a very wide structural blueprint, not a simple row-per-term table
- row `2` across columns contains the detailed field map for a comprehensive term/article schema
- column `A` functions as an outline/index of sections and subsections

## Architectural Implications From Real Data

- the glossary sheet can anchor browse, search, taxonomy, and slug generation
- the structure sheet should become an editorial schema registry
- the runtime app should not expose or require all `689` fields at launch
- a normalized block schema is the correct component boundary between source sheets and frontend rendering

## Official Research Areas Checked

Cloudflare:

- Workers
- Static Assets / Pages-to-Workers migration guidance
- D1
- KV
- R2
- Turnstile
- Workers testing with Vitest

Payments:

- Dodo Payments integration guide
- Dodo Checkout Sessions
- Dodo webhook events

## Official Source URLs

Cloudflare:

- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- https://developers.cloudflare.com/d1/
- https://developers.cloudflare.com/kv/
- https://developers.cloudflare.com/kv/concepts/how-kv-works/
- https://developers.cloudflare.com/r2/
- https://developers.cloudflare.com/turnstile/
- https://developers.cloudflare.com/workers/testing/

Dodo Payments:

- https://docs.dodopayments.com/developer-resources/integration-guide
- https://docs.dodopayments.com/developer-resources/checkout-session
- https://docs.dodopayments.com/developer-resources/webhooks

## Working Conclusions

- content should stay file-based and CDN-served
- user state should be relational
- the product should avoid a database-dependent content read path
- Dodo Checkout Sessions are the correct payment starting point
- auth should not be custom-built initially
- a launch importer can safely start from glossary columns `A` and `N:P` without waiting for the full structure-sheet merge

## Options Considered

### Option 1: Fully static content + D1 user state + Dodo Payments + external auth

Result: recommended

Why:

- matches content-heavy usage
- keeps launch architecture small
- supports all required paid features

### Option 2: all-in-one DB-backed glossary and user system

Result: not recommended for launch

Why:

- more runtime complexity than the product needs
- weaker separation between editorial content and user state

### Option 3: fully static app with client-only personalization

Result: rejected

Why:

- cannot support paid entitlements and cross-device user data well

## Open Questions For User

1. Can the two referenced sheets be made viewable to “Anyone with the link,” or can CSV exports be dropped into this repo?
2. Do you want launch auth to include only email login, or email + Google?
3. Should shared links expose only terms, or optionally public note snapshots too?
4. Do you want exports limited to Markdown/JSON in v1, or is PDF required at launch?
5. For design direction, should the surface feel more editorial-library or more modern product-workspace?

## Known Blockers

- final taxonomy and dedupe design cannot be locked without actual sheet data
- content pack sizing cannot be measured yet
- the existing older project has not been reviewed yet by request

## Addendum (2026-06-29)

### Consumer product design correction

- the first live homepage redesign improved the app materially but still drifted toward polished SaaS patterns
- a focused research pass was then added in `Docs/research/DESIGN_DIRECTION_RESEARCH_2026-06-29.md`
- conclusion: AIGlossary Pro should present as an editorial consumer learning brand with a private-library / field-guide mental model
- this means the landing page must preview learning interactions, concept clusters, notebook artifacts, and membership value instead of relying on text-led explanation
- the notebook and saved-study layer are part of the product identity, not secondary utilities

### Next design implications

- landing page should gain stronger visual proof of concept paths and saved-study artifacts
- inner routes should be redesigned to feel like one coherent consumer product rather than a marketing shell plus utility pages
- taxonomy should become spatial and navigable, not only described in prose

## Pass Notes

### Pass 1: Immediate correctness and completeness

- confirmed repo is empty enough to treat this as a fresh foundation
- confirmed sheet access blocker is real, not assumed
- avoided making fake content-structure claims

### Pass 2: Architecture and long-term viability

- chose a JSON-first content model with D1 for user state
- kept the runtime Cloudflare-native without adding unnecessary backend layers
- scoped out features that would likely recreate the old project’s complexity

### Pass 3: Rule compliance and supervision readiness

- documented exact commands and blockers
- separated verified facts from inferred recommendations
- recorded open questions before claiming any content-specific certainty

## Addendum (2026-06-29, implementation pass)

- Auth surface: Worker-side `/api/auth/session` and protected app APIs now resolve Clerk sessions against real token verification and D1 user row sync when `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` are both available.
- Billing surface: `/api/billing/checkout` and `/api/billing/webhook` are connected to the Dodo-hosted checkout flow with entitlement persistence into D1 and pending-entitlement claim path on session load.
- Study surface: saved data path is D1-first for authenticated users with active entitlement, with localStorage retained as fallback cache only.
- Verified evidence in this implementation pass: full TypeScript build and all Node/Python tests passing.
- Remaining hard dependencies to go fully live: production D1 binding, Clerk secret/publishable keys in Worker env, and Dodo API/product keys in env.

### Addendum (2026-06-29, runtime wiring)

- `wrangler.jsonc` now includes the canonical `DB` binding block for D1 with a canonical `database_name` and migration directory.
- local D1 simulation has been validated with:
  - `npm run cf:d1:migrate:local` (applies `0001_initial.sql` to local DB)
  - `wrangler dev --port 8789` showing active binding:
    `Binding env.DB (aiglossary-v2) D1 Database local`
- endpoint behavior now reflects real runtime contracts with D1 present:
  - `/api/bookmarks` returns `401` when session is missing (auth gate), not `503`
  - `/api/billing/checkout` returns `401` when unauthenticated (auth gate)
- remaining hard dependency for full production deployment remains Clerk and Dodo credentials plus a real remote D1 `database_id` bound in `wrangler.jsonc`.

### Addendum (2026-06-30, study migration pass)

- Implemented local-to-D1 study migration at sign-in in `src/study/StudyContext.tsx`:
  - load remote study snapshot when entitlement is active,
  - compute `StudySyncPlan` against browser snapshot,
  - upload only local-only bookmarks and notes before applying merged state.
- Added `src/study/sync.ts` contract + `src/study/sync.test.ts` for merge-plan and sync behavior.
- This pass removed the previous ambiguity where local data silently overrode remote behavior for paid users.
- Remaining decision: add explicit telemetry for partial sync failure and a user-visible recovery action for unsynced local study entries.
