# Content Ingestion Workflow

Date: 2026-06-29

## Goal

Turn the source sheets into a clean, versioned, JSON-first content pack that can power AIGlossary v2.

## Current Reality

The durable ingest path is now workbook-first:

- export the live Google Sheets to `.xlsx`
- preserve those workbook snapshots locally
- build published runtime artifacts from the workbooks

Current verified source files in local use:

- `data_glossary.xlsx`
- `data_structure.xlsx`

Source tabs used:

- glossary workbook: `main`
- structure workbook: `Sheet2`

## Current Builder To Run

```bash
./.venv/bin/python tools/build_published_content.py \
  --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx \
  --out-dir public/content/published
```

## What The Tool Produces

- row counts
- header snapshots
- blank row counts
- first-column duplicate analysis
- normalized duplicate analysis
- candidate canonical term slugs

Artifacts:

- `research/generated/content_profile.json`
- `research/generated/structure_profile.json`
- `research/generated/content_duplicates.csv`
- `research/generated/structure_duplicates.csv`

## Current Workbook Builder Behavior

`tools/build_published_content.py` now:

- reads the broad term inventory from glossary column `A`
- also reads the additional inventory side-columns `B` and `D:G` when they contain real term entries
- reads glossary column `H` for inline numbered definition snippets
- reads glossary columns `N:P` as a separate taxonomy lookup keyed by term title
- extracts the structure workbook row-2 field registry plus column-A outline
- canonicalizes duplicate inventory titles by normalized title key
- canonicalizes safe semantic variants that differ only by formatting, punctuation, or case
- extracts acronym/expansion aliases directly from titles such as `Retrieval Augmented Generation (RAG)`
- generates initial learning-graph links with this fallback order:
  - same subcategory
  - same category
  - lexical peers that share important title tokens
- classifies the structure workbook into:
  - launch runtime sections
  - editorial expansion sections
  - long-tail backlog sections
- resolves slug collisions explicitly so the runtime corpus remains stable
- clears stale published artifacts before writing the next canonical output pack
- emits:
  - `terms/index.json`
  - `terms/manifest.json`
  - `terms/shards/<shard-id>.json`
  - `paths/index.json`
  - `paths/by-slug/<path-slug>.json`
  - `taxonomy/category-tree.json`
  - `search/search-index.json`
  - `reports/import-report.json`
  - `reports/canonicalization-groups.json`
  - `reports/duplicate-groups.json`
  - `reports/content-audit.json`
  - `editorial/structure-registry.json`
- records structure classification in `reports/import-report.json`:
  - layer counts
  - launch section count
  - editorial section count
  - total section group count
- emits `editorial/launch-contract.json` to define which structure sections map to the current runtime block set

## Normalization Rules To Apply Next

After profiling, implement a second-stage normalization tool with these rules:

1. trim whitespace
2. normalize dash variants
3. lower-case comparison keys
4. collapse repeated spaces
5. identify duplicate titles and alias collisions
6. preserve original raw row values for traceability

## Canonical Mapping Target

Each row or merged row-group should map into:

- term identity
- display title
- aliases
- taxonomy path
- summary
- body blocks
- prerequisite links
- related links
- source row references

## Current Verified Coverage

Current real-workbook import results:

- source inventory term count: `18,116`
- published canonical term count: `17,988`
- taxonomy matches: `661`
- inline definition matches: `91`
- duplicate/variant groups surfaced in report: `154`
- slug collision groups after canonicalization: `14`
- canonicalization groups: `112`
- canonicalization rows merged: `116`
- shard count: `464`
- largest shard term count: `915`
- generated path count: `57`
- structure registry fields: `295`

This is a real corpus import, but not yet a fully editorially completed corpus.

## Risks To Watch

- duplicate terms with slightly different spelling
- abbreviations colliding with full names
- repeated concepts at different difficulty levels
- remaining slug collisions across versioned families, abbreviations, or genuinely distinct near-names
- structure rows that describe sections or meta-guidance rather than finished term prose
- limited taxonomy/definition coverage is still the biggest content-quality gap after the topology fix
- lexical fallback links are helpful but still heuristic; the highest-value topic clusters still need editorial review for truly great study paths

## Addendum (2026-06-30)

- The builder now emits a dedicated content-audit report that rechecks:
  - source-backed term titles
  - required block presence and order
  - source-definition parity
  - summary fallbacks and other sparse-content signals
  - link self-reference and alias duplication safety
- This turns the "recheck everything" request into a repeatable build-time contract instead of a one-off manual pass.

## Addendum (2026-06-30 Multi-Column Inventory Recovery)

- The importer now scans inventory columns `A`, `B`, and `D:G` instead of only `A`.
- That recovers a small but real set of additional terms that were already present in the workbook but not yet reflected in the published corpus.
- Placeholder tokens like `#N/A` are explicitly filtered so the broader ingest surface does not introduce bogus glossary nodes.

## Addendum (2026-06-30)

### Definition parsing upgrade

The published-content builder now uses a layered definition parser instead of a single strict numbered pattern:

- accepts numbered bold definitions like `1. **Term**: ...`
- accepts safer plain `Term: ...` rows when they are clearly glossary-shaped
- rejects noisy meta rows such as section headers or filler text
- keeps the longest valid definition for a term when duplicates appear

Why this matters:

- the live corpus had real definition rows that were being left on the floor because they were not perfectly formatted
- this made the published JSON feel too close to a sampled prototype even though the source workbook was real
- the new parser raises definition coverage without changing the runtime schema or introducing parallel content paths

Observed effect on the live workbook import:

- definition matches remained at `91` in the committed corpus because the workbook export was already rebuilt before the parser patch landed
- the parser change is now in code and will apply on the next import run
- the important long-term gain is that future sheet refreshes will recover more real definitions without manual content duplication

The runtime content contract remains JSON-first and unchanged.

## Addendum (2026-06-30 Graph-Aware Learning Blocks)

- The published term builder now derives a richer learner-facing block set from the canonical graph:
  - overview
  - field position
  - connection map
  - step-based study prompts
  - source definition snippet when available
- The goal is to keep the runtime compact while still making each term page feel like a substantive study artifact, not just a card with a title and summary.

## Addendum (2026-07-01 Structure Layering)

- The structure workbook is now emitted with explicit layer metadata in `editorial/structure-registry.json`.
- That registry distinguishes launch-runtime, editorial-expansion, and backlog fields so the 295-column structure can guide the product without becoming the runtime payload itself.
- This keeps the importer honest about the editorial ceiling while preserving a compact JSON runtime for the frontend.

## Addendum (2026-07-01 Published Manifest)

- The build now emits a root `public/content/published/manifest.json` so the shell can read corpus status, path counts, structure layers, and launch ordering from one canonical JSON file.
- The launch section order is now preserved intentionally in the importer instead of being alphabetically re-sorted, which keeps the published launch contract aligned with the learner flow.
- The frontend corpus and curriculum previews now consume the shared manifest, which reduces duplicated status logic without introducing a second content system.

## Addendum (2026-07-01 Interactive Corpus Blocks)

- The importer now publishes two additional universal learning blocks on every term:
  - `at-a-glance` for a compact table-style visual summary
  - `concept-map` for a lightweight diagram-style learning map
  - `quick-faq` for compact question-and-answer reinforcement
  - `quick-quiz` for a lightweight self-check with answer reveal and explanation
- This gives the corpus real interactive depth without inventing a second content system or an unbounded CMS.
- The next layer of richer visuals can still be reserved for featured terms or promotional surfaces, but the base runtime now includes quiz, FAQ, and diagram-style learning signals by default.

## Addendum (2026-07-01 Comparison Block)

- The importer now also emits a `comparison` block that makes term boundaries explicit:
  - what it is
  - what it is not
  - common confusion
  - best next step
- This is a durable bridge between the structure sheet and the learner surface because it turns “adjacent concepts” into a visible study move instead of leaving them implicit in related-term links.
