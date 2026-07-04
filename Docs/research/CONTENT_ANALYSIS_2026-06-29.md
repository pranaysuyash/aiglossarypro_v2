# Content Analysis

Date: 2026-06-29
Evidence tier: Tier 1 for structure and metadata, Tier 2 for targeted live range reads

## What Was Verified

Using live Google Drive sheet access:

- `AI ML DL terminologies` -> tab `main`
- `AI ML book structure` -> tab `Sheet2`

Verified counts:

- glossary `main`: `21,593` rows x `32` columns
- structure `Sheet2`: `1,000` rows x `689` columns

## Shape Of The Two Sources

### 1. Glossary source

The glossary sheet is the inventory surface.

Verified roles:

- column `A`: term list
- columns `N:P`: taxonomy fields

Observed taxonomy examples:

- `Abductive Reasoning` -> `Reasoning Methods` -> `Logical Reasoning`
- `Accuracy` -> `Evaluation Metrics` -> `Classification Metrics`
- `Activation Function` -> `Neural Networks` -> `Components`
- `AI Safety` -> `Ethics & Governance` -> `Safety Measures`

Interpretation:

- this is enough for launch browse/search taxonomy
- we do not need the old project’s likely overbuilt content model just to get v1 live

### 2. Structure source

The structure sheet is an authoring blueprint, not a publish-ready runtime table.

Verified roles:

- row `2` across columns contains the actual field catalog
- column `A` contains the section outline
- the blueprint includes long-form educational, implementation, ethics, benchmarks, metadata, MLOps, compliance, and localization sections

Interpretation:

- the sheet is editorial gold
- it is too wide to be the direct runtime schema

## First-Principles Conclusion

The correct long-term solution is not:

- one giant 689-field term payload
- or a naive static glossary with no structure

The correct solution is:

- compact learner-first runtime schema
- backed by a richer editorial superset

## Recommended Content Layers

### Layer 1: Launch runtime fields

- title
- aliases
- summary
- topic
- category
- subcategory
- related terms
- note anchors

### Layer 2: Learner blocks

- introduction
- prerequisites
- theory
- how it works
- variants
- applications
- implementation
- evaluation
- pros and cons
- ethics
- history
- related concepts
- further reading

### Layer 3: Deep metadata

- complexity
- hardware characteristics
- deployment notes
- licensing
- datasets
- benchmarks
- compliance
- localization
- maintenance
- MLOps

## Monetization Implication

Because the source structure is deep, the monetizable product should not sell “a glossary”.

It should sell:

- structured AI learning
- organized depth
- personal study tooling
- progressive concept understanding

That justifies paid-only access much better.

## Component Implication

Frontend components should be block-based and optional:

- `TermHero`
- `TermSummary`
- `TaxonomyPills`
- `PrerequisiteGraph`
- `ConceptSection`
- `HowItWorksFlow`
- `ApplicationsPanel`
- `ImplementationPanel`
- `MetricsPanel`
- `EthicsPanel`
- `RelatedTermsPanel`
- `PersonalNotesPanel`

This is the scalable boundary between content variability and UI consistency.

## Immediate Follow-Up

1. normalize the main glossary into slugs + taxonomy + aliases
2. define a bounded block registry from the structure blueprint
3. choose the minimum editorial subset required for launch
4. only then expand the importer and page renderers against the canonical registry

## Progress Update

The first launch importer now exists:

- `tools/build_published_content.py`

Current importer scope:

- title from glossary column `A`
- taxonomy from glossary columns `N:P`
- published artifacts:
  - term JSON by slug
  - term index
  - taxonomy tree
  - search index
  - normalization report

## Addendum (2026-06-29)

Using refreshed Google Drive connector access, the live glossary sheet shape was re-checked directly and exposed more real ingest hazards:

- the workbook contains multiple noisy or duplicated column regions beyond the launch-safe fields
- the `main` sheet includes mixed/generated content in later columns that should not enter launch runtime content blindly
- duplicate terms should be canonicalized at import time instead of surfacing as multiple public entries because of slug collisions alone

Importer correction now implemented:

- duplicate titles are canonicalized by normalized title key
- merged source row numbers are preserved for traceability
- a duplicate-group report is emitted as `reports/duplicate-groups.json`

This is closer to the real full-corpus ingest behavior needed for the 18k+ glossary than the old slug-collision-only approach.

This confirms the product can stay JSON-first without waiting for the full editorial-depth merge.

## Addendum (2026-06-30 Study Flow Upgrade)

- The runtime corpus now publishes a step-based `Study Prompts` block for each term, which makes the default page feel like a learning sequence rather than a bullet dump.
- This is a small schema change with a large product effect: the learner can now see a prescribed order for engaging with the term, even when taxonomy is sparse.

## Addendum (2026-06-30 Corpus Accuracy Audit)

- The published-content build now emits `reports/content-audit.json`.
- The audit rechecks title/source traceability, required block order and presence, source-definition parity, summary fallback use, and link self-reference safety.
- This turns the request to recheck term accuracy into a repeatable validation surface instead of a one-off manual promise.
- Coverage gaps remain visible in the report so sparse taxonomy or definition coverage is treated as editorial backlog, not silently disguised as completeness.

## Addendum (2026-06-30 Source Trace UI)

- Term pages now expose workbook source-trace chips and label the imported source-definition snippet distinctly.
- This makes the accuracy work visible to learners as part of the product, not only as a behind-the-scenes build artifact.
- The page still stays consumer-facing: the source trace supports trust, but the main experience remains the learning explanation and study loop.

## Addendum (2026-07-01 Editorial Depth Expansion)

- The published corpus now adds three more generated editorial surfaces to every term: `Why It Matters`, `Comparison Notes`, and `Recall Drill`.
- These blocks are driven by the term's taxonomy, inferred study family, and graph neighbors, so the extra depth stays source-aware instead of becoming a second hand-authored content system.
- This is the right long-tail strategy because the 18k-term corpus can now gain study usefulness everywhere, even where the workbook only supplies a sparse definition or only taxonomy.

## Addendum (2026-07-01 Corpus Status Snapshot)

- The current published term corpus contains `17,988` unique normalized terms in `public/content/published/terms/index.json`.
- Canonicalization merged `429` source rows across `126` duplicate groups, which means the runtime corpus is already deduped rather than a straight row dump.
- Coverage is intentionally uneven and honest:
  - `661` terms have taxonomy coverage.
  - `91` terms have source definition blocks.
  - `4,928` terms are in the study-family layer.
- The runtime surface is therefore "done" as a published corpus shape, but not yet done as a fully deep editorial corpus for every term.
- That split is useful for product planning: the app can already ship a coherent learning shell, while the long tail continues to gain deeper content over time.
