# Content Lifecycle and Versioning

Date: 2026-07-04
Status: Active

## Purpose

This document explains where AI Glossary content lives, how the structure layer is saved, how new terms are introduced, and what versioning exists today.

## Addendum (2026-07-04 Source Ledger)

The long-term source-of-truth model is no longer "the Excel files are the content system."

The repo now has a diffable content-source ledger:

- `content/source/terms.jsonl`
- `content/source/content-lock.json`
- `content/source/emerging-terms-2024-2026.json`
- `content/migrations/slug-history.json`
- `content/schemas/term-source.v1.schema.json`
- `content/schemas/content-source-manifest.v1.schema.json`

The workbooks remain import sources and editorial interchange files, but the durable content-control plane is the ledger. Every term has a stable `termId`, `status`, `revision`, `canonicalSlug`, `slugHistory`, source provenance, and content hashes. Recent/emerging terms are tracked as their own diffable source seed before they flow through the workbook/published build path. Removals should be represented as tombstones (`removed`, `merged`, or `deprecated`), not as silent missing rows.

Decision record: `Docs/architecture/ADR-0007-content-source-ledger.md`.

## The Real Content Layers

The app has four content layers that matter:

1. Source ledger
2. Import workbooks
3. Editorial registry data
4. Generated published corpus
5. Runtime fetch layer

### 1) Source ledger

This is the diffable, versioned content-control layer:

- `content/source/terms.jsonl`
- `content/source/content-lock.json`
- `content/source/emerging-terms-2024-2026.json`
- `content/migrations/slug-history.json`

`terms.jsonl` is one term per line so add/update/remove review is possible in git. `content-lock.json` records source hashes and the ledger hash. `slug-history.json` preserves the stable ID to slug-history mapping for future rename, merge, split, and redirect work.

`emerging-terms-2024-2026.json` records the recent AI/ML term seed that was originally appended through the workbook path. It keeps the title list and taxonomy decisions reviewable in source control instead of leaving them hidden in the binary workbook.

### 2) Import workbooks

These are current import/editorial interchange inputs:

- `data_glossary.xlsx`
- `data_structure.xlsx`

They are no longer the intended long-term content system by themselves because binary workbook diffs cannot reliably explain term-level changes.

### 3) Editorial registry data

This repo also keeps an editorial taxonomy registry:

- `data/taxonomy-registry.json`

This file is the authoritative editorial taxonomy source for term classification. It is not a runtime UI file; it is build input.

### 4) Generated published corpus

The published runtime corpus is generated into:

- `public/content/published/terms/index.json`
- `public/content/published/terms/by-slug/*.json`
- `public/content/published/terms/shards/*.json`
- `public/content/published/paths/index.json`
- `public/content/published/paths/by-slug/*.json`
- `public/content/published/editorial/structure-registry.json`
- `public/content/published/editorial/launch-contract.json`
- `public/content/published/manifest.json`
- `public/content/published/reports/*.json`

This is the actual content the frontend serves to users.

### 5) Runtime fetch layer

The browser reads the published corpus through:

- `src/content/CatalogContext.tsx`
- `src/content/publishedManifest.ts`
- `src/content/structureRegistry.ts`
- `src/content/launchContract.ts`

The frontend does not fetch directly from the source workbooks.

## How New Terms Get Updated

When new terms are added or changed, the durable flow is:

1. Add or update the source-ledger row in `content/source/terms.jsonl`.
2. Preserve `termId`; update `revision`, `canonicalSlug`, and `slugHistory` if a title or slug changes.
3. For removals, keep a row with `status=removed`, `status=merged`, or `status=deprecated`.
4. Update taxonomy decisions in `data/taxonomy-registry.json` when classification changes.
5. Re-export from workbook inputs only when the workbook changed and compare source-ledger deltas with:

```bash
./.venv/bin/python tools/content_diff.py before.jsonl content/source/terms.jsonl \
  --fail-removals-without-tombstone
```

6. Validate the source ledger:

```bash
./.venv/bin/python tools/validate_content_source.py
```

7. Rebuild the published corpus with:

```bash
./.venv/bin/python tools/build_published_content.py \
  --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx \
  --out-dir public/content/published
```

8. Commit the source ledger, source inputs, build pipeline, and regenerated published corpus together when the change is ready.

## What The Structure Workbook Means

`data_structure.xlsx` is not stored as a runtime content tree.

The build script reads `Sheet2` and turns it into two published artifacts:

- `editorial/structure-registry.json`
- `editorial/launch-contract.json`

### Structure registry

The structure registry is the generated view of the workbook’s field registry and outline:

- field list
- section grouping
- launch-runtime vs editorial-expansion vs backlog classification
- section order metadata

It is generated metadata, not a separate content CMS.

### Launch contract

The launch contract is the runtime-facing subset of the structure registry. It tells the app which structure sections map to the compact launch block set.

That means:

- the workbook can be broad
- the runtime can stay compact
- the mapping stays explicit instead of implied

## Versioning Today

Versioning now exists at two levels:

- source-ledger versioning in `content/source/*`
- repository snapshot versioning through git

### What is versioned today

- `content/source/terms.jsonl` is versioned in git
- `content/source/content-lock.json` is versioned in git
- `content/source/emerging-terms-2024-2026.json` is versioned in git
- `content/migrations/slug-history.json` is versioned in git
- Source workbooks are versioned in git
- `data/taxonomy-registry.json` is versioned in git
- `tools/build_published_content.py` is versioned in git
- the generated published corpus is versioned in git

The source manifest includes:

- `schemaVersion`
- `contentVersion`
- source file hashes
- source row hash

The published manifest includes:

- `schemaVersion`
- `contentVersion`
- `builderVersion`
- `publishedAt`
- source hashes
- artifact-hash report pointer and hash
- corpus counts
- coverage metrics
- structure counts

That gives both a semantic source snapshot and a runtime publication snapshot.

### What is not versioned today

- There is no version history per structure section
- There is no version history per subsection
- There is no full per-term editorial revision log beyond the current `revision` field and git history

The current model is source-ledger plus snapshot-based. It is not yet a full CMS revision-log system.

## Subsection Versioning

There is no subsection-level versioning today.

What exists instead is:

- workbook row/column source evidence
- generated section group metadata
- git commit history
- published snapshot timestamps

If a subsection changes, the current system regenerates the corpus snapshot. It does not preserve an independent subsection revision chain.

## Long-Term First-Principles View

The current target model is:

- one diffable source ledger
- one published runtime corpus
- one authoritative taxonomy registry
- one runtime fetch layer
- reusable import/export/validation/diff tools

The remaining gap is fine-grained editorial history and making the builder read the source ledger directly instead of treating it as a control-plane overlay.

If the product needs subsection-level versioning, the durable path is:

- stable section IDs
- stable subsection IDs
- explicit version fields
- a change log or revision table
- migration rules for old content snapshots

That is not fully implemented today.

## Repo Consistency Note

The published corpus is intended to be tracked, not ignored.

The repo previously had a `.gitignore` entry for `public/content/published/`, which conflicted with the documented build-and-commit workflow. That ignore rule should not be treated as the long-term model for this repo.

## Practical Summary

- Source-control truth for term identity/versioning: `content/source/terms.jsonl`
- Import source for current workbook-origin term data: `data_glossary.xlsx`
- Import source for current structure data: `data_structure.xlsx`
- Source truth for taxonomy decisions: `data/taxonomy-registry.json`
- Runtime content: `public/content/published/*`
- Runtime readers: the `src/content/*` loaders
- Current versioning: source ledger, content lock, slug history, git history, and published snapshot manifests
- No subsection versioning yet
