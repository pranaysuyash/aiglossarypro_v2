# ADR-0005: Tiered Editorial Depth for the Published Corpus

Date: 2026-07-01
Status: Accepted
Owner: Codex implementation pass

## Decision

Keep the published corpus JSON-first, but make editorial depth tiered rather than uniform.

Every published term should remain valid and browsable in the compact launch runtime, but terms that have stronger source and graph signal should be promoted into a `featured` editorial tier with an additional deep-dive block.

The corpus therefore has three practical depth tiers:

- `featured` for concepts that deserve a richer teaching treatment
- `standard` for the normal launch stack
- `sparse` for entries that are still intentionally lightweight

The same tiering should be visible across:

- term pages
- discovery/library surfaces
- learning paths
- account and membership proof surfaces
- saved shelf and notebook summaries

## Context

The app already has a real published corpus from workbook exports, a compact launch block set, and a wide structure workbook that is better treated as an editorial ceiling than as a runtime mirror.

The user explicitly asked for:

- a full learning product, not a sample
- strong long-term architecture
- content that can scale without becoming a complicated CMS
- better visuals and interactivity where they matter

The corpus audit also makes the editorial gap visible:

- almost all terms can be published and browsed
- only a small subset has source-backed definitions or taxonomy depth
- some concepts deserve more explanation, diagrams, and recall support than others

Uniform depth would make the best concepts feel underdeveloped and would also pressure the whole corpus into an unnecessary CMS shape.

The user also clarified that the 295-field structure is not a cap they requested. The tiered runtime model is an implementation choice for the current build, not a statement that the rest of the structure should never graduate into the product. Long-term, more of the structure can become universal if the corpus and UX benefit from it.

## Options Considered

### Option A: Keep all terms visually identical

Pros:

- simplest rendering model
- no editorial tier logic

Cons:

- ignores the real variation in source quality and graph signal
- makes featured concepts feel too flat
- does not help the product feel curated

Decision: rejected

### Option B: Build a second CMS-like content system for rich concepts

Pros:

- maximum flexibility for long-form content

Cons:

- creates a second source of truth
- increases operational complexity
- risks repeating the overcomplicated prior project

Decision: rejected

### Option C: Keep one JSON corpus, add editorial tiers, and surface them selectively

Pros:

- preserves the single published corpus
- keeps the runtime compact and CDN-friendly
- allows the strongest concepts to feel more authored
- works naturally across discovery, paths, term pages, and member surfaces

Cons:

- requires tier-aware UI and content generation
- needs ongoing judgment to avoid over-promoting weak entries

Decision: accepted

## Consequences

### Positive

- featured concepts can get deeper, more visual treatment without bloating the entire corpus
- the home, library, path, and account surfaces can explain why the product is worth paying for
- the private study workspace can show what kind of content the learner is saving
- content generation stays scalable because tiering is computed from the same corpus and graph signals already in the importer
- future generator passes can promote more of the structure workbook into universal runtime blocks without breaking the single JSON-first contract

### Tradeoffs

- tier classification is heuristic and must be periodically reviewed
- the editorial boundary must stay visible so sparse content does not pretend to be richer than it is
- featured content still needs periodic quality audits so the deep-dive treatment remains earned

## Implementation Notes

- the importer assigns editorial tiers during published corpus generation
- every published term receives the compact `structure-expansion` bridge block
- featured terms receive an additional `deep-dive` block
- published manifest artifacts expose tier counts
- discovery, paths, account, saved shelf, and notes surfaces can read the same tier information
- the shared `workspaceInsights` helpers can summarize the tier mix for saved concepts and notes without duplicating logic

Affected files:

- `/Users/pranay/Projects/aiglossary_v2/tools/build_published_content.py`
- `/Users/pranay/Projects/aiglossary_v2/src/types.ts`
- `/Users/pranay/Projects/aiglossary_v2/src/content/publishedManifest.ts`
- `/Users/pranay/Projects/aiglossary_v2/src/routes/ExplorePage.tsx`
- `/Users/pranay/Projects/aiglossary_v2/src/routes/PathDetailPage.tsx`
- `/Users/pranay/Projects/aiglossary_v2/src/routes/AccountPage.tsx`
- `/Users/pranay/Projects/aiglossary_v2/src/routes/SavedPage.tsx`
- `/Users/pranay/Projects/aiglossary_v2/src/routes/NotesPage.tsx`
- `/Users/pranay/Projects/aiglossary_v2/src/study/workspaceInsights.ts`

## Validation Plan

- regenerate published JSON from the workbook exports
- verify the manifest exposes tier counts
- verify the structure-expansion block is present on every published term while deep-dive remains featured-only
- verify featured terms receive the deep-dive block
- verify the term, path, discovery, account, saved, and notebook surfaces all consume the same tier model
- keep tests and build green after content regeneration

## Revisit Triggers

Revisit this ADR if:

- the corpus starts using a second editorial content system
- the tiering starts hiding too much sparse content
- featured deep dives become the default for too many terms
- the runtime schema expands beyond the compact JSON-first contract
