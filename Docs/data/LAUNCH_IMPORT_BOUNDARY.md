# Launch Import Boundary

Date: 2026-06-29
Status: Active implementation rule

## Purpose

Prevent the content pipeline from becoming overcomplicated before launch.

## Launch-Safe Source Columns

Use only the verified trustworthy glossary fields for the first published content pack:

- column `A`: term title
- column `N`: topic
- column `O`: category
- column `P`: sub category

## Why This Boundary Exists

The glossary sheet contains additional columns with mixed quality and unclear semantics.

The structure sheet contains a valuable but very large editorial blueprint.

Trying to fully merge both into the first importer would recreate the same failure mode as the older overcomplicated project.

## What The Launch Importer Must Produce

- canonical term JSON by slug
- term index
- taxonomy tree
- search index
- normalization report

## What Is Explicitly Deferred

- extracting aliases from noisy columns
- deriving full related-term graphs automatically
- importing all structure-sheet fields into runtime blocks
- generating long-form educational content automatically
- interactive quiz content generation
- research paper linking automation
- localization generation

## Why Deferred Does Not Mean Forgotten

These are preserved in the editorial schema and documentation. They are simply not required for the first clean launch path.

## Import Sequence

1. profile source
2. normalize launch-safe fields
3. publish JSON artifacts
4. wire app shell to those artifacts
5. add richer editorial layers incrementally

## Tooling

Active launch importer:

- `tools/build_published_content.py`

Current profiler:

- `tools/profile_glossary_csv.py`

## Addendum (2026-06-30)

`tools/normalize_glossary_launch.py` was used during early architecture experiments and is retained as a reference for the old approach.
The active production boundary now uses `tools/build_published_content.py` with:

- live workbook reads from `data_glossary.xlsx` and `data_structure.xlsx`
- duplicate/slug canonicalization and alias retention
- taxonomy/report artifact publishing into `public/content/published`
- direct JSON-first consumption by the frontend catalog loader.
