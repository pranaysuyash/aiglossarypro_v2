# Content Ingestion Workflow

Date: 2026-06-29
Latest Addendum: 2026-07-04

## Goal

Turn the source sheets and source ledger into a clean, versioned, JSON-first content pack that can power AIGlossary v2.

## Current Reality

The durable ingest path is now ledger-first with workbook import compatibility:

- export the live Google Sheets to `.xlsx` when workbook-origin content changes
- preserve those workbook snapshots locally
- export or update the diffable source ledger
- validate source identity, slug history, and tombstone rules
- build published runtime artifacts from the canonical builder

Current verified source files in local use:

- `content/source/terms.jsonl`
- `content/source/content-lock.json`
- `content/source/emerging-terms-2024-2026.json`
- `content/migrations/slug-history.json`
- `data_glossary.xlsx`
- `data_structure.xlsx`
- `data/taxonomy-registry.json`

Source tabs used:

- glossary workbook: `main`
- structure workbook: `Sheet2`

## Source Ledger Commands

Export or refresh the source ledger from the current published corpus:

```bash
./.venv/bin/python tools/export_workbooks_to_source.py
```

Validate the ledger:

```bash
./.venv/bin/python tools/validate_content_source.py
```

Compare two ledgers before accepting source changes:

```bash
./.venv/bin/python tools/content_diff.py before.jsonl content/source/terms.jsonl \
  --fail-removals-without-tombstone
```

Inventory current source and published counts:

```bash
./.venv/bin/python tools/content_inventory.py
```

Append missing recent terms from the diffable emerging-term source into the workbook import surface:

```bash
./.venv/bin/python tools/add_emerging_terms.py
```

This command is idempotent. The term list and taxonomy decisions live in `content/source/emerging-terms-2024-2026.json`, not inside the script.

## Current Builder To Run

```bash
./.venv/bin/python tools/build_published_content.py \
  --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx \
  --out-dir public/content/published
```

## What The Profiling Tools Produce

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
- writes to a staging directory first and swaps into the requested output directory only after the audit passes
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
- emits root `manifest.json` with `schemaVersion`, `contentVersion`, `builderVersion`, source hashes, and an artifact-hash report pointer

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

- stable term ID
- status and revision
- term identity
- display title
- slug history
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

## Addendum (2026-07-04 Source Ledger)

The first source-ledger snapshot records:

- active source terms: `18,075`
- source manifest: `content/source/content-lock.json`
- schema version: `content-source-term.v1`
- content version: `2026.07.04-source-v1`
- emerging AI/ML seed terms: `109`

The ledger is intentionally text-based and source-controlled. It is the review surface for term-level add/update/remove decisions. Workbooks remain import sources until the builder is migrated to read the ledger directly.

The recent-term seed is also source-controlled in `content/source/emerging-terms-2024-2026.json`. Those terms are classified through `data/taxonomy-registry.json` so they do not depend on fallback auto-classification.

Removal rule:

- do not delete a term row to remove content
- preserve the row and set `status=removed`, `status=merged`, or `status=deprecated`
- update `slugHistory` and redirect metadata in a later migration when user-facing redirects are implemented

The builder now stages output before replacing `public/content/published`, so a failed build should not leave the runtime corpus empty.

## Risks To Watch

- duplicate terms with slightly different spelling
- abbreviations colliding with full names
- repeated concepts at different difficulty levels
- remaining slug collisions across versioned families, abbreviations, or genuinely distinct near-names
- structure rows that describe sections or meta-guidance rather than finished term prose
- limited taxonomy/definition coverage is still the biggest content-quality gap after the topology fix
- lexical fallback links are helpful but still heuristic; the highest-value topic clusters still need editorial review for truly great study paths
- the source ledger is currently exported from the published corpus; the next architectural step is making it the builder input instead of a control-plane overlay

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
- This is a durable bridge between the structure sheet and the learner surface because it turns “adjacent concepts” into a visible study move instead of leaving them implicit in related-term links.## Addendum (2026-07-04 Structure Expansion Bridge)

- The importer now publishes `structure-expansion` for every term, not only for featured terms.
- The block surfaces a ranked slice of the broader workbook ceiling, with `editorial-expansion` sections shown before `backlog` sections.
- The explicit `STRUCTURE_EDITORIAL_SECTION_ORDER` is preserved in `editorial/structure-registry.json` so downstream consumers do not silently lose the editorial sequence.

## Addendum (2026-07-04 Taxonomy Registry Pipeline)

- The editorial taxonomy registry (`data/taxonomy-registry.json`) is now the primary taxonomy source for the build pipeline.
- Registry entries override workbook taxonomy fields and auto-classification rules. The build prioritizes: registry > workbook taxonomy > auto-classification.
- The registry grew from 13,256 → 17,717 entries through automated batch classification.

### Batch Classification Pipeline (Consolidated)

The batch classification pipeline now runs from a single script — `tools/classify_unclassified.py` — which combines three graduated strategies:

1. **v3 — Explicit term mapping**: ~600-entry dictionary of exact term → (category, subCategory) pairs.
2. **v1 — Pattern-list matching**: ~200 keyword patterns for architectures, datasets, tools, math concepts, and vendor names.
3. **v2 — Suffix/prefix regex**: Architecture suffixes (-Former, -ViT, -GAN), dataset patterns (Set, Dataset), optimizer prefixes (Ada*, Diff*).

The four legacy scripts (`classify_remaining.py` through `classify_remaining_v4.py`) were consolidated and removed. The consolidated script supports `--dry-run`, `--out`, `--merge`, `--backup`, and `--limit N` flags with 23 unit tests.

Total coverage impact: from 74.49% baseline to 100%.

### Coverage Progression

| Stage | Coverage | Unclassified | Paths |
|---|---|---|---|
| Baseline | 75.20% | 4,461 | 57 |
| Token similarity (v1 proposal) | 90.15% | 1,772 | 181 |
| Pattern-list (v1 classifier) | 92.45% | 1,353 | — |
| Suffix/regex (v2 classifier) | 94.20% | 1,038 | — |
| Explicit mapping (v3 classifier) | 97.69% | 374 | — |
| Final cleanup (v4 classifier) | 99.99% | 1 | 194 |
| Final (after SlimPajama fix) | 100.00% | 0 | 194 |

### Correction Quality

- Spot check of 20 random v2 classifications: **18/20 correct (90%)**
- Spot check of 30 random registry entries: **0 issues found**
- Reviewer-flagged fixes applied: 7 (FlashAttention → Model Optimization, Make.com → ML Frameworks, etc.)
- Remaining ~200 estimated errors in 2,689 original proposals (from token similarity pass) noted but not individually fixed; the v2-v4 passes added cleaner classifications on top

### Key Files

- `data/taxonomy-registry.json` — canonical editorial taxonomy registry (17,717 entries)
- `tools/propose_taxonomy_registry.py` — token-similarity proposal engine (first pass, 2,689 proposals)
- `tools/classify_unclassified.py` — consolidated batch classifier (replaces legacy v1-v4 scripts)
- `public/content/published/reports/content-audit.json` — per-build quality audit with coverage tracking
