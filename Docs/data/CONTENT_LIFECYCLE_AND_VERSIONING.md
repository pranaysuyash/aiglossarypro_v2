# Content Lifecycle and Versioning

Date: 2026-07-04
Status: Active

## Purpose

This document explains where AI Glossary content lives, how the structure layer is saved, how new terms are introduced, and what versioning exists today.

## The Real Content Layers

The app has four content layers that matter:

1. Source workbooks
2. Editorial registry data
3. Generated published corpus
4. Runtime fetch layer

### 1) Source workbooks

These are the editable authoring inputs:

- `data_glossary.xlsx`
- `data_structure.xlsx`

They are the primary human-maintained sources for new terms, term structure, and curriculum layout.

### 2) Editorial registry data

This repo also keeps an editorial taxonomy registry:

- `data/taxonomy-registry.json`

This file is the authoritative editorial taxonomy source for term classification. It is not a runtime UI file; it is build input.

### 3) Generated published corpus

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

### 4) Runtime fetch layer

The browser reads the published corpus through:

- `src/content/CatalogContext.tsx`
- `src/content/publishedManifest.ts`
- `src/content/structureRegistry.ts`
- `src/content/launchContract.ts`

The frontend does not fetch directly from the source workbooks.

## How New Terms Get Updated

When new terms are added or changed, the usual flow is:

1. Update the glossary workbook or the editorial registry as needed.
2. Update the structure workbook when the curriculum shape changes.
3. Update taxonomy decisions in `data/taxonomy-registry.json` when classification changes.
4. Rebuild the published corpus with:

```bash
./.venv/bin/python tools/build_published_content.py \
  --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx \
  --out-dir public/content/published
```

5. Commit the source inputs, the build pipeline, and the regenerated published corpus together when the change is ready.

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

Versioning exists, but it is mostly repository-level versioning, not fine-grained content versioning.

### What is versioned today

- Source workbooks are versioned in git
- `data/taxonomy-registry.json` is versioned in git
- `tools/build_published_content.py` is versioned in git
- the generated published corpus is versioned in git

The published manifest also includes:

- `publishedAt`
- corpus counts
- coverage metrics
- structure counts

That gives a timestamped snapshot, but not a semantic content version.

### What is not versioned today

- There is no semantic `contentVersion` field in the published corpus
- There is no version history per structure section
- There is no version history per subsection
- There is no per-term editorial revision history in the published JSON

The current model is snapshot-based, not revision-log-based.

## Subsection Versioning

There is no subsection-level versioning today.

What exists instead is:

- workbook row/column source evidence
- generated section group metadata
- git commit history
- published snapshot timestamps

If a subsection changes, the current system regenerates the corpus snapshot. It does not preserve an independent subsection revision chain.

## Long-Term First-Principles View

The current model is good for a small team because it is simple and auditable:

- one build script
- one published corpus
- one authoritative taxonomy registry
- one runtime fetch layer

The gap is fine-grained editorial history.

If the product eventually needs subsection-level versioning, the durable path would be to add:

- stable section IDs
- stable subsection IDs
- explicit version fields
- a change log or revision table
- migration rules for old content snapshots

That is not implemented today.

## Repo Consistency Note

The published corpus is intended to be tracked, not ignored.

The repo previously had a `.gitignore` entry for `public/content/published/`, which conflicted with the documented build-and-commit workflow. That ignore rule should not be treated as the long-term model for this repo.

## Practical Summary

- Source truth for term prose: `data_glossary.xlsx`
- Source truth for structure: `data_structure.xlsx`
- Source truth for taxonomy decisions: `data/taxonomy-registry.json`
- Runtime content: `public/content/published/*`
- Runtime readers: the `src/content/*` loaders
- Current versioning: git history plus published snapshot timestamps
- No subsection versioning yet

