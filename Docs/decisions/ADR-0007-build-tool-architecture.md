# ADR-0007: Build Tool Architecture — `tools/build_published_content.py`

Date: 2026-07-04
Status: Accepted (live, 6 batch iterations)
Owner: Implementation pass

## Decision

Use a single, self-contained Python script (`tools/build_published_content.py`) as the canonical content pipeline that transforms two source workbooks (`data_glossary.xlsx`, `data_structure.xlsx`) into the complete published corpus JSON (`public/content/published/`). The pipeline runs as a deterministic offline build step — not a runtime service.

Pipeline stages (in order):

1. **Extract** — Load glossary workbook (columns A/B/D–G for inventory, N:P for taxonomy, H for definitions) and structure workbook (Sheet2 row 2 for editorial field registry).
2. **Merge** — Deduplicate near-identical formatting/case/punctuation variants into canonical terms, preserving source evidence for each merge decision.
3. **Enrich** — Infer taxonomy via a four-tier priority chain: editorial registry → workbook taxonomy → keyword auto-classification → study-family metadata mapping.
4. **Build** — Construct term records (summary, blocks, links, metadata, shard assignment) and compute editorial depth tiers (featured/standard/sparse).
5. **Shard** — Split the full term list into deterministic two-character shard files so detail loading can be lazy.
6. **Index** — Generate search index, taxonomy tree, learning paths, and catalog index from the completed term corpus.
7. **Report** — Emit content audit, import report, canonicalization groups, and duplicate-group reports.

## Context

The product serves 17,988 terms from a real workbook with 21,593 rows × 32 columns. The structure workbook has 1,000 rows × 689 columns. This is too large for runtime source parsing — a build step is required.

Key constraints that shaped the architecture:

- **Workbook-aware, not clean-table**: The glossary sheet has multi-column inventory (columns A/B/D–G are all valid term columns), a taxonomy lookup keyed by title (N:P), and inline definition rows (H). A simple CSV read would lose the multi-column source structure.
- **Single-run determinism**: Running the same workbooks on the same code must produce byte-identical output. No random seeds, no LLM calls, no runtime state.
- **18k-term scale**: 17,988 records must build in under 5 minutes on a laptop. The script achieves ~3.5 minutes.
- **Editorial depth tiers**: Terms vary in source quality. The pipeline assigns `featured` / `standard` / `sparse` tiers based on definition presence, taxonomy depth, alias count, and link density — not uniform depth.
- **Multi-source taxonomy**: Four classification tiers (editorial registry > workbook > auto-rules > study-family map) ensure every tier has a fallback without false-positive cascading.
- **Deterministic sharding**: Term shards use the first two alphanumeric characters of the slug — stable across builds and predictable for client-side loading.

## Options Considered

### Option A: Runtime pipeline (Worker builds content on demand)

Pros:
- No build step
- Content always fresh

Cons:
- Slow cold starts (18k terms × workbook parsing)
- Non-deterministic without careful version pinning
- Couples content generation to runtime availability
- Harder to diff, review, and roll back

Decision: rejected.

### Option B: Distributed pipeline (multiple scripts, intermediate stages)

Pros:
- Easier to parallelize
- Lower per-file complexity

Cons:
- Higher coordination cost
- Multiple intermediate serialization boundaries
- Harder to understand end-to-end flow
- Unnecessary for 18k terms (fits comfortably in memory)

Decision: rejected.

### Option C: Single script with stage functions (chosen)

Pros:
- End-to-end flow visible in one file (~3,000 lines)
- Deterministic: same inputs → same outputs
- Easy to debug, diff, and test
- No external state or orchestration
- Fast enough (~3.5 min for 18k terms)

Cons:
- Single-file size makes parallel agent edits harder
- All stages share one process — OOM risk if term count grows 10×
- Python import/parse time is paid on every run

Decision: accepted.

## Why This Path

The single-script architecture matches the product's content scale and editorial requirements:

- 18k terms is a batch size, not a stream — a pipeline is the right shape
- Deterministic output enables git-diff-based content review and rollback
- Four-tier taxonomy classification ensures coverage growth without cumulative false-positive risk
- Sharding is built into the build step so the frontend has no runtime aggregation cost
- The script is self-documenting: each stage function has a clear input/output contract and docstring

## Consequences

### Positive

- **Deterministic**: Running with the same workbooks produces identical output (byte for byte, tested with git diff)
- **Auditable**: Every term's taxonomy source is recorded (`autoClassified`, `taxonomySource` metadata fields)
- **Testable**: Unit tests use synthetic workbooks that exercise each pipeline stage
- **Frontend-simple**: The frontend loads pre-built shards and manifests — no server-side aggregation
- **Rollback-safe**: Previous published content stays in git; rebuild overwrites `public/content/published/`
- **CLI-controlled**: Flags for glossary path, structure path, output dir, taxonomy registry, and coverage threshold

### Negative

- **Single-threaded**: ~3.5 min build time on a laptop; no parallelism within the script
- **Memory-bound**: Entire 18k-term corpus is held in Python dicts during build (~600 MB peak)
- **Single-file size**: `build_published_content.py` is ~3,000 lines — large for a single file but intentionally so for end-to-end visibility
- **Python dependency**: Requires `openpyxl` and `.venv` — not zero-dependency
- **Build step required**: Content changes require a rebuild before they're visible in the app

## Implementation Notes

### Pipeline Stage Functions (in order)

| Function | Phase | Purpose |
|---|---|---|
| `extract_term_inventory()` | Extract | Read glossary columns A/B/D–G, build deduplicated term index |
| `merge_semantic_variants()` | Merge | Group near-duplicate formatting/case variants into canonical terms |
| `extract_taxonomy_lookup()` | Extract | Read glossary columns N:P as title-keyed taxonomy lookup |
| `extract_definition_lookup()` | Extract | Read glossary column H for inline definition snippets |
| `load_taxonomy_registry()` | Enrich | Load `data/taxonomy-registry.json` (Tier 1 editorial decisions) |
| `build_term_record()` | Build | Construct a single term record with taxonomy, blocks, links, metadata |
| `auto_classify_term()` | Classify | Score-based keyword matching against `AUTO_CLASSIFICATION_RULES` |
| `infer_study_family()` | Classify | Token-based study-family detection (Tier 4 fallback) |
| `build_blocks()` | Build | Generate runtime block structure (overview, taxonomy, connections, etc.) |
| `build_term_shards()` | Shard | Split term records into deterministic two-char shard groups |
| `build_learning_paths()` | Build | Generate curated learning paths from taxonomy groups |
| `build_search_index()` | Index | Generate the runtime client-side search index |
| `build_taxonomy_tree()` | Index | Generate the runtime taxonomy category tree |
| `build_content_audit()` | Report | Emit coverage metrics, quality checks, depth/tier analysis |
| `build_catalog_index()` | Index | Generate the lightweight browse index (no block/body bloat) |

### Taxonomy Classification Tiers

1. **Tier 1 — Editorial Registry** (`data/taxonomy-registry.json`): Curated per-term decisions, most authoritative
2. **Tier 2 — Workbook Taxonomy** (columns N:P): Source-backed classification from the glossary sheet
3. **Tier 3 — Auto-Classification** (`AUTO_CLASSIFICATION_RULES`): 365 keyword rules across 6 batches
4. **Tier 4 — Study-Family Map** (`STUDY_FAMILY_TAXONOMY_MAP`): Metadata-driven fallback for Evaluation/Ethics/Statistics/Similarity terms

Each tier only fires if the previous tier produced no category — no cascading overrides.

### Auto-Classification Scoring

```python
score = (multi_word_matches × 3 + single_word_matches) × priority
```

- Multi-word keywords (e.g., `attention based`) get 3× weight vs single-token (e.g., `loss`)
- Priority ranges 7–10; higher = more authoritative
- Threshold = 8: a rule must reach score 8+ to classify a term

## Validation Plan

- **Determinism check**: Build twice on the same workbooks; `git diff` output dirs. Both runs produce identical JSON.
- **Coverage threshold gate**: The script enforces `TAXONOMY_COVERAGE_MINIMUM` (0.74) — builds below 74% taxonomy coverage print a warning but succeed with `--coverage-threshold 0`.
- **Fixture tests**: `test_build_published_content.py` creates a synthetic workbook with known terms and verifies all output artifacts (shards, paths, search index, reports) match expected values.
- **Quality audits**: Each batch of auto-classification rules is validated by sampling classified terms and verifying category correctness (zero misclassifications across 6 batches as of 2026-07-04).

## Revisit Triggers

Revisit this ADR if:

- Term count grows beyond 50k (memory pressure)
- Build time exceeds 10 minutes
- Content updates become near-real-time (current build step would be a bottleneck)
- Multiple editors need to run independent builds concurrently
- The content source migrates away from Excel workbooks (e.g., to a CMS or API)

## Related Files

- `tools/build_published_content.py` — the build script
- `tests/test_build_published_content.py` — fixture-based build tests
- `Docs/data/AUTO_CLASSIFICATION_STRATEGY.md` — auto-classification rule evolution
- `Docs/decisions/ADR-0008-study-family-tier-4.md` — study-family taxonomy mapping ADR
- `Docs/decisions/ADR-0009-content-sharding-strategy.md` — sharding design ADR
- `Docs/data/CONTENT_INGESTION_WORKFLOW.md` — data pipeline workflow
- `Docs/data/CANONICAL_TERM_SCHEMA.md` — term record schema
- `Docs/data/EDITORIAL_TO_RUNTIME_MAPPING.md` — editorial → runtime field mapping
