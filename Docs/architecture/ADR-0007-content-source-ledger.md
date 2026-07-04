# ADR-0007: Diffable Content Source Ledger

Date: 2026-07-04
Status: Accepted

## Context

AI Glossary currently serves users from `public/content/published/*`, but its editable term and structure inputs have been workbook-first (`data_glossary.xlsx`, `data_structure.xlsx`) plus taxonomy JSON. That shape worked for import speed, but it is not a durable content system:

- XLSX diffs do not show meaningful term-level add/update/remove changes.
- Runtime JSON can be regenerated, making large diffs hard to review.
- Term identity was slug/title-derived, so rename, merge, split, and tombstone workflows had no stable control-plane record.
- The builder deleted the output directory before writing, so interrupted builds could leave a partial or empty runtime corpus.
- Published manifests had counts and timestamps, but not enough source/artifact hashes to explain exactly what changed.

## Decision

Add a versioned, diffable source ledger under `content/source/` and treat workbooks as import sources rather than the long-term source-of-truth shape.

The first ledger version contains:

- `content/source/terms.jsonl` — one source term per line with `termId`, `status`, `revision`, `sourceKey`, `canonicalSlug`, `slugHistory`, taxonomy, metadata, source provenance, and content hashes.
- `content/source/content-lock.json` — source manifest with `schemaVersion`, `contentVersion`, source file hashes, source row hash, and artifact references.
- `content/migrations/slug-history.json` — stable term ID to slug-history map for future rename/merge/split migration.
- `content/schemas/*.schema.json` — documented source and manifest contracts.
- Tools for export, inventory, validation, and diffing.

The existing builder remains canonical for published runtime artifacts in this stage, but it now writes into a staging directory and only swaps into the requested output directory after the content audit passes. Its published manifest also records schema/content/builder version, source hashes, and artifact hashes.

## Options Considered

1. Keep XLSX as the only source truth.
2. Move immediately to a full CMS/database.
3. Add a diffable source ledger now, then migrate authoring and builder inputs toward it in controlled stages.

## Chosen Path

Option 3.

It gives the repo a real content-control plane immediately without an unbounded rewrite. Workbooks can still be imported, but content review, versioning, tombstones, slug history, and future migration can happen in text artifacts that git can diff.

## Tradeoffs

- The first ledger is generated from the current published corpus, so it captures current truth but does not yet replace the builder's workbook input path.
- The ledger adds large source-controlled text files. That is acceptable because the corpus itself is product data, not cache.
- A later stage should make `content/source/terms.jsonl` the builder input, with workbooks becoming import/export adapters.

## Validation Plan

- `tools/validate_content_source.py` must pass for `content/source/terms.jsonl`.
- `tools/content_diff.py --fail-removals-without-tombstone` must be used for source-ledger comparisons before accepting removals.
- `tests/test_content_source_tools.py` covers stable ID disambiguation, validation, tombstone enforcement, manifest hashes, and live source validation.
- Existing published-content tests continue to guard runtime artifact compatibility.

## Rollback / Migration

If the ledger needs to be regenerated, keep the previous committed ledger and run `tools/content_diff.py` before replacing it. Missing rows should be converted to `status=removed`, `status=merged`, or `status=deprecated` rather than silently disappearing.

## Revisit Triggers

- The builder begins reading `content/source/terms.jsonl` directly.
- Term rename/merge/split workflows need richer revision history.
- Runtime payload size is reduced by removing duplicated full detail records from both `terms/by-slug` and `terms/shards`.
- An external CMS or database becomes the operational authoring system.
