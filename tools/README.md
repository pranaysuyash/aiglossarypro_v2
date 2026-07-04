# Tools

Reusable project tools live here. Prefer these over one-off scripts in `/tmp`.

## Content Source Tools

### Export the source ledger

```bash
./.venv/bin/python tools/export_workbooks_to_source.py
```

Creates:

- `content/source/terms.jsonl`
- `content/source/content-lock.json`
- `content/migrations/slug-history.json`

The exporter reads the current published corpus and records a reviewable source ledger with stable `termId`, `canonicalSlug`, `slugHistory`, source provenance, and content hashes.

### Add recent AI/ML terms to the workbook import surface

```bash
./.venv/bin/python tools/add_emerging_terms.py
```

The source list lives at `content/source/emerging-terms-2024-2026.json`. The command is idempotent: it scans the workbook inventory columns and only appends missing titles.

### Validate the source ledger

```bash
./.venv/bin/python tools/validate_content_source.py
```

Fails on duplicate term IDs, duplicate canonical slugs, invalid statuses, missing slug history, missing source keys, invalid revisions, or invalid content hashes.

### Inventory content layers

```bash
./.venv/bin/python tools/content_inventory.py
```

Reports published corpus counts alongside source-ledger counts.

### Diff two source ledgers

```bash
./.venv/bin/python tools/content_diff.py before.jsonl after.jsonl --fail-removals-without-tombstone
```

Use this before accepting generated source changes. Real removals should be represented as tombstones (`status=removed`, `status=merged`, or `status=deprecated`) instead of disappearing rows.

## Published Content Builder

```bash
./.venv/bin/python tools/build_published_content.py \
  --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx \
  --out-dir public/content/published
```

The builder now writes to a staging directory, runs the content audit, and only swaps into the requested output directory after success. This avoids leaving a partial runtime corpus when a build fails.
