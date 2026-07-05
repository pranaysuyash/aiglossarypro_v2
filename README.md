# AIGlossary v2

AI/ML/DL learning app foundation for a paid-first glossary and study workspace.

## Current State

Implemented:

- planning and architecture docs
- verified sheet-structure analysis
- canonical content schema
- workbook-driven published content builder
- shard-based published content runtime topology
- canonical alias merging for safe formatting/case/punctuation duplicates
- acronym/expansion alias extraction plus fallback study-link enrichment
- D1 schema baseline
- Clerk-backed sign-in and sign-up route surface
- Worker-side Clerk session verification path
- Dodo checkout route and webhook entitlement ingestion path
- automatic pending-entitlement claiming on authenticated session load
- frontend shell with all routes (home, pricing, explore, paths, terms, saved, notes, account)
- study workspace with bookmark, note, annotation, share, and export flows
- Worker app with static asset serving and billing/study API endpoints

### Editorial Pipeline (2026-07-04)

- **Taxonomy registry** (`data/taxonomy-registry.json`): canonical editorial taxonomy source with 17,717 entries
- **Batch classification pipeline**: consolidated classifier (`tools/classify_unclassified.py`) with three graduated strategies — explicit mapping, pattern-list matching, and suffix/prefix regex
- **Coverage**: 99.80% taxonomy coverage (18,075 terms), up from 53.54% baseline
- **194 learning paths** (was 57 at baseline)
- **0 high-severity quality issues**
- **109 emerging terms added** (2024-2026 concepts)

## Commands

```bash
npm install
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
npm run dev
npm run dev:api
npm run dev:worker
npm run build
npx wrangler deploy --dry-run
./.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
./.venv/bin/python tools/build_published_content.py \
  --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx \
  --out-dir public/content/published
```

### Content Builder CLI Flags

The `tools/build_published_content.py` script accepts the following flags:

| Flag | Type | Required | Default | Description |
|---|---|---|---|---|
| `--glossary-workbook` | path | ✅ | — | Path to the glossary workbook (`data_glossary.xlsx`). Columns A/B/D–G provide the term inventory, columns N/P provide taxonomy lookups, column H provides definition snippets. |
| `--structure-workbook` | path | ✅ | — | Path to the structure workbook (`data_structure.xlsx`). Sheet2 row 2 contains the editorial field registry. |
| `--out-dir` | path | ✅ | — | Output directory for published content artifacts (terms, paths, search index, taxonomy tree, reports, editorial metadata). |
| `--taxonomy-registry` | path | ❌ | `data/taxonomy-registry.json` | Path to the authoritative editorial taxonomy registry. Pass `__disabled_registry_for_fixture__` to disable it entirely (used in tests). |
| `--coverage-threshold` | float | ❌ | `0.74` (TAXONOMY_COVERAGE_MINIMUM) | Minimum taxonomy coverage ratio gate. If coverage drops below this threshold, a warning is printed. Use `0` to disable the gate entirely (useful during development or when iterating on auto-classification rules).

## Local Setup

- canonical repo root: `/Users/pranay/Projects/aiglossary_v2`
- frontend dev server: `npm run dev`
- local preview API stub: `npm run dev:api`
- signed-in preview API stub for UI QA: `AIGLOSSARY_DEV_AUTH=1 npm run dev:api`
- Worker API dev server: `npm run dev:worker`
- Vite proxies `/api/*` to `http://127.0.0.1:8787`; during local UI work that port can be served by either the Worker dev server or the preview API stub
- static plan copy remains renderable without the Worker, but account/auth/billing state is now treated as unavailable instead of silently downgraded
- Python utilities now use `openpyxl` through the project `.venv` for real workbook ingestion

## Important Boundaries

- content is intended to be JSON-first
- the real workbook importer treats glossary column `A` as the broad term inventory and glossary columns `N:P` as a taxonomy lookup keyed by title rather than a row-aligned table
- the structure sheet is ingested as an editorial field registry and outline, not as direct runtime prose; the featured/standard/sparse depth choices are product implementation decisions in the current build, not a limit you set on the corpus or a permanent cap on the 295-field structure
- the importer now also emits `editorial/launch-contract.json`, which maps the current launch runtime block set back to the structure workbook so the public app stays compact while the editorial ceiling stays explicit
- the home page now surfaces corpus progress from `reports/content-audit.json` so the product can show how many terms are published, definition-backed, and study-family linked without inventing a fake completion metric
- the home page now also separates browsing by mode: read, follow a path, save memory, and review/export, which keeps the first impression consumer-facing instead of dashboard-like
- the account, saved, notes, and paths surfaces are now intentionally framed as a member continuity room, study shelf, study notebook, and guided learning trail respectively
- authenticated study state now targets Worker + D1 by default when a real session is present
- Clerk verification and Dodo event ingestion are implemented, with `/api/health` now exposing runtime capability flags and checkout gated by live Dodo + D1 readiness.
- study-state code now treats localStorage as a backup cache while authenticated state sync remains Worker/D1-first
- Dodo webhook persistence now uses stable logical entitlement ids so recurring subscription events update one purchase record instead of multiplying entitlements
- published term detail now loads from deterministic shard artifacts instead of one JSON file per term
- the content builder now merges safe near-duplicate formatting variants into canonical terms with aliases, while leaving genuinely distinct version/family terms separate
- the published index now includes learner-facing link hints generated from subcategory peers first, then category peers, then lexical fallbacks for otherwise orphaned terms
- share links now resolve through a public Worker token endpoint plus `/shared/:token` frontend route instead of copying a dead private URL

## Key Files

- `Docs/product/AIGLOSSARY_V2_MASTER_PLAN_2026-06-29.md`
- `Docs/architecture/TECHNICAL_ARCHITECTURE_2026-06-29.md`
- `Docs/data/CANONICAL_TERM_SCHEMA.md`
- `Docs/data/AUTO_CLASSIFICATION_STRATEGY.md` — full taxonomy auto-classification pipeline: rule evolution, scoring formula, per-batch details, quality audits, hard-200 corrections, and Batch 7 candidate analysis
- `Docs/data/TAXONOMY_REGISTRY.md` — editorial taxonomy registry: batch classification, coverage tracking, and merge operations
- `data/taxonomy-registry.json` — canonical editorial taxonomy source (17,717 entries)
- `tools/propose_taxonomy_registry.py` — token-similarity + heuristic classification proposal engine
- `tools/classify_unclassified.py` — consolidated batch classifier (replaces legacy v1-v4 scripts)
- `Docs/data/LAUNCH_IMPORT_BOUNDARY.md`
- `Docs/data/CONTENT_INGESTION_WORKFLOW.md`
- `Docs/data/CONTENT_INGESTION_WORKFLOW.md`
- `Docs/deployment/CLOUDFLARE_RUNTIME_SETUP_2026-06-29.md`
- `infra/d1/schema.sql`
- `infra/d1/migrations/0001_initial.sql`
- `tools/build_published_content.py`
- `worker/index.ts`
