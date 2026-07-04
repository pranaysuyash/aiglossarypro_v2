# Taxonomy Registry

Date: 2026-07-04
Status: Active

## Overview

The taxonomy registry (`data/taxonomy-registry.json`) is the authoritative editorial taxonomy source for the AIGlossary v2 build pipeline. It maps normalized term keys to (category, subCategory) pairs, serving as the primary taxonomy signal before auto-classification rules or workbook taxonomy fields.

## Design

### Priority Order

The build pipeline resolves taxonomy in this order:

1. **Taxonomy registry** (highest priority) — authoritative editorial classifications
2. **Auto-classification rules** — heuristic-based fallback
3. **Workbook taxonomy columns** (N:P) — lowest priority

### Registry Schema

```json
{
  "$schema": "https://aiglossary.dev/schemas/taxonomy-registry.v1.json",
  "kind": "taxonomy-registry",
  "description": "Authoritative editorial taxonomy registry. ...",
  "sourceCorpus": "/path/to/public/content/published",
  "keyCount": 17717,
  "categoryCounts": { "Neural Networks": 3675, ... },
  "sourceTermTotal": 17988,
  "sourceTermWithTaxonomy": 15931,
  "collisionCount": 130,
  "entries": {
    "1-bit-adam": {
      "category": "Optimization Algorithms",
      "subCategory": "Gradient-Based Optimizers"
    },
    ...
  }
}
```

## Pipeline

The registry is maintained through three complementary tools:

### `tools/propose_taxonomy_registry.py`
Token-similarity + heuristic classification proposal engine. Builds a token→category index from existing classified terms, then proposes categories for unclassified terms via:
- StudyFamily mapping (zero false-positive risk)
- Named-entity heuristics (datasets → Data Processing, tools → ML Frameworks, vendors → AI Applications)
- Specificity-weighted token similarity (confidence threshold 0.35)

### `tools/classify_unclassified.py`
Consolidated batch classifier combining three graduated strategies:

| Strategy | Method | Accuracy |
|---|---|---|
| v3 (explicit mapping) | 600+ curated term entries | ~99% |
| v1 (pattern-list) | Known architecture, dataset, tool names | ~90% |
| v2 (suffix/regex) | -Net, -Former, Ada* patterns | ~85% |

Strategies run in order; the first match wins. Supports `--dry-run`, `--out` (save proposals), `--merge` (write to registry), `--backup` (safety backup), and `--limit` (testing).

### `tools/build_published_content.py`
The build pipeline consumes the registry via the `--taxonomy-registry` flag (default: `data/taxonomy-registry.json`). Pass `__disabled_registry_for_fixture__` to disable it for testing.

## Coverage Progression

| Date | Coverage | Unclassified | Paths | High Severity Issues |
|---|---|---|---|---|
| 2026-06-29 baseline | 75.20% | 4,461 | 57 | 0 |
| 2026-07-01 auto-classification | 75.20% | 4,461 | 83 | 0 |
| 2026-07-04 token similarity | 90.15% | 1,772 | 181 | 0 |
| 2026-07-04 batch v1 (pattern-list) | ~92% | ~1,353 | — | 0 |
| 2026-07-04 batch v2 (suffix/regex) | ~94% | ~1,038 | — | 0 |
| 2026-07-04 batch v3 (explicit mapping) | ~98% | ~374 | — | 0 |
| 2026-07-04 batch v4 (final cleanup) | 99.99% | 1 | 194 | 0 |
| 2026-07-04 final SlimPajama fix | 100.00% | 0 | 194 | 0 |

## Quality

- Spot check of 30 random registry entries: **0 issues found**
- Reviewer-flagged corrections applied: 7 (FlashAttention → Model Optimization, Make.com → ML Frameworks, etc.)
- Estimated ~200 errors in the original 2,689 token-similarity proposals noted but not individually corrected; later passes added cleaner classifications on top

## Usage

```bash
# Classify unclassified terms (dry-run, preview only)
python3 tools/classify_unclassified.py \
  --terms-index public/content/published/terms/index.json

# Classify and save proposals (no registry mutation)
python3 tools/classify_unclassified.py \
  --terms-index /tmp/build/terms/index.json \
  --out /tmp/proposals.json

# Classify and merge into registry (with backup)
python3 tools/classify_unclassified.py \
  --terms-index /tmp/build/terms/index.json \
  --registry data/taxonomy-registry.json \
  --merge --backup

# Generate new proposals from token similarity
python3 tools/propose_taxonomy_registry.py \
  --terms-index /tmp/build/terms/index.json \
  --registry data/taxonomy-registry.json \
  --out /tmp/editorial-proposals.json \
  --merge-file /tmp/merge-entries.json

# Rebuild published artifacts
python3 tools/build_published_content.py \
  --glossary-workbook data_glossary.xlsx \
  --structure-workbook data_structure.xlsx \
  --out-dir public/content/published
```
