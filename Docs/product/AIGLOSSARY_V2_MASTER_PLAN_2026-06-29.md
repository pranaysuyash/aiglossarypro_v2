# AIGlossary v2 Master Plan

Date: 2026-06-29
Status: Active planning baseline
Confidence: 0.78

## Purpose

Build a paid-only AI learning web app that turns a large glossary/topic corpus into a durable study product, not just a searchable dictionary.

The product should:

- make 18k+ AI/ML/DL terms learnable, not merely browsable
- support private study workflows: bookmarks, notes, annotations, exports, and shareable deep links
- stay simple enough to launch on Cloudflare without the old project’s complexity
- keep content operations mostly file-based so the knowledge layer remains portable

## Product Thesis

AIGlossary v2 should be positioned as a structured AI self-learning system:

- glossary + concept map
- topic-to-topic progression
- personal study workspace
- explainers written for different depth levels
- durable reference plus active learning

This is stronger than a plain “AI terms encyclopedia” because the moat comes from:

- breadth of coverage
- structured taxonomy
- cross-links between concepts
- personal knowledge workflows
- a clean paid-only experience without free-tier product compromises

## User Promise

The app helps a serious learner answer four questions fast:

1. What does this term mean?
2. Where does it fit in the AI stack?
3. What should I learn before and after it?
4. What do I personally want to remember about it?

## Paid Model

No free plan.

Recommended commercial structure:

- `Pro Subscription`
  - monthly
  - yearly
- `Pro Lifetime`
  - one-time purchase

Both plans unlock the same core product. The difference is entitlement duration, not feature fragmentation.

Why this is the right shape:

- simpler pricing page
- lower support burden
- less entitlement complexity
- easier commercial messaging and entitlement handling
- easier future analytics and reporting

## Access Model

No free plan does not mean no public website.

Recommended public surfaces:

- landing page
- pricing page
- changelog / roadmap
- SEO-safe taxonomy pages
- limited teaser previews for selected terms or category hubs

Recommended gated surfaces:

- full term bodies
- personal notes
- bookmarks
- learning collections
- exports
- full search results depth

This keeps acquisition possible without creating a third “free” product tier.

## Core Experience

### 1. Explore

- search across terms, aliases, abbreviations, and category paths
- browse AI/ML/DL taxonomy
- move through related/prerequisite/next concepts

### 2. Learn

- each term has a concise definition
- then a deeper explanation
- then related terms and learning path positioning
- optional examples, formulas, code references, and “why this matters”

### 3. Organize

- bookmark a term
- attach a private note
- create highlights / annotations against structured content blocks
- group saved items into collections such as `LLM basics`, `Deep learning math`, `MLOps`

### 4. Share and Export

- copy canonical deep links to terms
- optionally share public note snapshots
- export personal notes/bookmarks as Markdown and JSON
- later add PDF export for “study pack” output

## Information Architecture

Recommended top-level app sections:

1. `Home`
2. `Explore`
3. `Paths`
4. `Saved`
5. `Notes`
6. `Account`

Recommended term page structure:

1. title + aliases
2. short definition
3. deeper explanation
4. concept position
5. prerequisites
6. related terms
7. next topics
8. references / source notes
9. personal note + bookmark + export actions

## Canonical Content Model

The content sheet and structure sheet should be normalized into one canonical term document format.

```json
{
  "id": "transformer-architecture",
  "slug": "transformer-architecture",
  "title": "Transformer Architecture",
  "aliases": ["transformer model"],
  "summary": "Short learner-facing definition.",
  "body": [
    {
      "id": "intro",
      "type": "paragraph",
      "text": "Longer explanation."
    }
  ],
  "taxonomy": {
    "domain": "deep-learning",
    "categoryPath": ["Deep Learning", "Neural Architectures", "Transformers"],
    "difficulty": "intermediate"
  },
  "links": {
    "prerequisites": ["attention-mechanism"],
    "related": ["bert", "gpt"],
    "next": ["multi-head-attention"]
  },
  "learning": {
    "whyItMatters": "Why the concept matters.",
    "commonConfusions": ["transformer vs transducer"],
    "examples": []
  },
  "source": {
    "contentRowId": "main:1234",
    "structureRowId": "Sheet2:87",
    "version": "2026-06-29"
  }
}
```

Why this model matters:

- portable between providers
- easy to version in Git or object storage
- supports structured rendering
- supports precise note anchors later
- avoids over-coupling raw sheets to runtime

## Content Depth Direction

The structure workbook should be treated as the editorial ceiling and long-term growth map, not as a user-imposed limit on the corpus.

Current runtime should stay compact enough to ship and operate cleanly, but the generator and UI should keep moving toward:

- richer universal coverage where the structure adds learner value
- selective deep dives where the source graph is strongest
- quiz, diagram, comparison, and notebook surfaces that make the product feel like a real study tool instead of a sheet mirror

The present featured / standard / sparse split is an implementation strategy, not a permanent taxonomy law.

## Recommendation: Keep Content File-Based

Yes, we can use JSON as the primary content layer.

Recommended split:

- source of editorial truth: CSV exports from the sheets, then normalized into repo-managed JSON
- runtime public content: versioned JSON shards
- runtime user state: relational storage

Why not put glossary content directly into the user database:

- content is mostly read-heavy and versioned
- file-based content is easier to diff, cache, rebuild, and export
- content delivery should be CDN-friendly
- user state and content state have different access patterns

## Recommended Technical Shape

### Frontend / App Runtime

Recommended:

- React
- React Router full-stack mode on Cloudflare Workers
- TypeScript
- componentized UI system from day one

Why this path:

- simpler than a large Next.js deployment surface
- one Cloudflare-native runtime for app + API
- easy route-based code splitting
- good fit for a content-heavy app with some personalized features

### Storage by responsibility

- public glossary content: versioned JSON shards in static assets or R2
- search manifest / lightweight lookup tables: static JSON, optionally KV-backed cache later
- user accounts, entitlements, bookmarks, notes, shares: D1
- export artifacts and large generated files: R2

### Payments

Recommended:

- Dodo Payments Checkout Sessions for recurring and lifetime purchases
- Dodo payment webhooks into a Worker endpoint
- D1 entitlements table as app-side source of truth

### Auth

Recommended launch path:

- external auth provider plus D1 app user table

Recommended provider preference:

1. Clerk
2. Better Auth only if you explicitly decide later that deeper auth ownership is worth the added complexity

Reason:

- auth is not the product moat
- paid products need reliable login, account recovery, and session handling
- trying to be clever here is how projects stay unlaunched

Important monetization rule:

- payment completion and account linkage must not be the same fragile step
- Dodo events should be able to create recoverable pending entitlements before full user claiming

## Search Strategy

Do not make search depend on live database scanning for glossary reads.

Recommended approach:

- build a precomputed search index during ingest
- ship it in shards
- run instant client-side search in a Web Worker
- add server-side search later only if needed for analytics, ranking, or SEO APIs

Expected scale:

- 18k terms is small enough for a careful static-search strategy
- the challenge is quality, normalization, and deduplication, not raw scale

## Data and Content Pipeline

1. export Google Sheets tabs as CSV
2. run normalization and profiling
3. detect duplicates and alias collisions
4. map rows into canonical term JSON
5. generate taxonomy manifests
6. generate search shards
7. publish versioned content pack

## Launch Scope

### Phase 1: Paid Knowledge Core

- auth
- pricing + checkout
- entitlement gating
- search
- term pages
- bookmarks
- private notes
- simple exports
- basic share links

### Phase 2: Learning System

- curated paths
- spaced review queues
- progress states
- “study this next” recommendations
- richer annotation UX

### Phase 3: Premium Depth

- term comparison
- concept graphs
- saved study packs
- AI-assisted explanation variants
- admin editorial tools

## What Not To Build First

- multi-role admin complexity
- collaborative workspaces
- complicated WYSIWYG editing
- heavy server-side search infra
- custom payment flow when Dodo-hosted checkout is enough
- multiple app shells or duplicate frontends

## Design Direction Guidance

The UI should feel like a serious knowledge instrument, not a generic AI SaaS dashboard.

Recommended aesthetic direction:

- editorial technical library
- dense but calm
- typography-led
- visible concept structure
- strong sense of hierarchy and cross-reference

Differentiation anchor:

- a term page should feel like a living study card crossed with an annotated technical handbook page

## Business Value

User value:

- faster structured learning
- less scattered note-taking
- one place for AI concept understanding and personal study memory

Business value:

- simple monetization model
- portable content assets
- lower infra cost
- SEO and direct traffic potential

Operational value:

- content can ship without expensive DB migrations
- clear separation between public content and private user data
- Cloudflare-native hosting keeps runtime simple

## Current Blockers

- none for sheet inspection while the Google Drive connector is available
- full offline repeatability still benefits from CSV exports or committed snapshots

## Verified Content Findings

The content model is no longer hypothetical. Verified from the connected sheets:

- glossary spreadsheet title: `AI ML DL terminologies`
- main tab: `21,593` rows and `32` columns
- structure spreadsheet title: `AI ML book structure`
- `Sheet2`: `1,000` rows and `689` columns

Important interpretation:

- the glossary sheet is the term inventory
- the structure sheet is not a term dataset in the same shape
- `Sheet2` is a very wide authoring blueprint / content template for how a term page could be structured

This changes the architecture in a useful way:

- we should not try to mirror all `689` possible structure columns directly into the launch UI
- we should distill them into a smaller component schema for v1
- the wide structure sheet should become the editorial superset, not the runtime payload

## Verified Data Signals

From the glossary `main` tab:

- column `A` is the primary term list
- columns `N:P` contain a clean taxonomy trio:
  - `topic`
  - `category`
  - `sub category`

Example verified taxonomy rows:

- `Abductive Reasoning` -> `Reasoning Methods` / `Logical Reasoning`
- `Accuracy` -> `Evaluation Metrics` / `Classification Metrics`
- `Activation Function` -> `Neural Networks` / `Components`
- `AI Governance` -> `Ethics & Governance` / `AI Policy`

This is strong enough to justify a practical v1 information architecture:

- term identity from column `A`
- taxonomy browse from `N:P`
- richer explanatory content generated or curated into a normalized JSON layer

## Runtime Schema Implication

The app should use a three-layer content system:

1. `Core Term`
   - title
   - aliases
   - summary
   - category path

2. `Extended Learning Blocks`
   - introduction
   - prerequisites
   - theory
   - how it works
   - applications
   - implementation
   - evaluation
   - ethics
   - related concepts

3. `Deep Metadata`
   - benchmarks
   - deployment details
   - compliance
   - localization
   - research classification

V1 should render only the blocks that create clear learner value. The rest should remain available in the editorial schema for later expansion.

## Immediate Next Moves

1. get CSV exports for the two tabs into this repo
2. run the profiling tool
3. lock the canonical content schema against the real columns
4. establish the app shell and data contracts
5. implement auth + Dodo Payments + D1 entitlement core
