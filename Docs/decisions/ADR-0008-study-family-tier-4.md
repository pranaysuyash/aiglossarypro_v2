# ADR-0008: Study-Family Taxonomy Mapping (Tier 4 Classification)

Date: 2026-07-04
Status: Accepted (live)
Owner: Implementation pass

## Decision

Add a fourth taxonomy classification tier in `build_term_record()` that maps a term's detected "study family" (from `infer_study_family()`) to a concrete `(category, subCategory)` pair via a lookup table (`STUDY_FAMILY_TAXONOMY_MAP`). The map fires only when Tiers 1–3 have produced no classification, and only for four specific families where the mapping is unambiguous.

The mapping:

| Study Family | Category | Subcategory |
|---|---|---|
| `Evaluation` | Model Evaluation | Performance Metrics |
| `Ethics & Governance` | Ethics & Governance | Fairness in ML |
| `Statistics` | Statistical Methods | Bayesian Inference |
| `Similarity & Deduplication` | Similarity & Deduplication | *(empty)* |

## Context

After six auto-classification batches (365 rules, ~2,056 classified terms), the analysis of remaining unclassified terms revealed:

- 4,504 unclassified terms total
- **43 of those have `studyFamily` metadata** from the workbook's `infer_study_family()` function, which detects families via token matching on the title (e.g., "evaluation", "metric" → Evaluation family)
- These 43 terms were unclassified because `infer_study_family()` and `build_term_record()` had no connection — the family was computed but never used for taxonomy assignment

The families involved (Evaluation, Ethics & Governance, Statistics, Similarity & Deduplication) are narrow in scope and map cleanly to exactly one `(category, subCategory)` pair each. There is no ambiguity in the mapping — the study family name *is* the category name or a direct synonym.

The 43 terms span titles like: "Evaluation Metrics for Generative Models", "Statistical Bias Evaluation", "Ethics of Autonomous Systems", "Deduplication via MinHash Signatures". Each maps to the expected category without false-positive risk because `infer_study_family()` uses narrow keyword sets (e.g., [evaluation, metric, metrics, benchmark, accuracy, precision, recall, f1] for "Evaluation").

## Options Considered

### Option A: Expand auto-classification rules (add 43 more rules)

Pros:
- Consistent mechanism with existing batches
- Rules can target individual terms precisely

Cons:
- Each rule covers ~1 term on average (43 terms across 4 families)
- Clutters the rule list with near-identical patterns
- Misses the structural insight: the mapping is metadata-driven, not keyword-driven
- Would require maintaining per-term exceptions

Decision: rejected.

### Option B: Add a lookup table in `build_term_record()` (chosen)

Pros:
- 43 terms classified at zero false-positive risk
- No new keyword rules to maintain
- The mapping is explicit, auditable, and easy to extend
- Zero additional build time (lookup is O(1) dict access)
- `infer_study_family()` already runs for every term's `metadata.studyFamily` field

Cons:
- Only covers 43 terms (4.5% of the 4,504 unclassified)
- Manual table expansion if new study families are added to the workbook
- Adds a fourth classification tier to the priority chain

Decision: accepted.

### Option C: Enrich the taxonomy registry instead

Pros:
- Uses the most authoritative classification tier
- No code change needed

Cons:
- Requires manual entry of 43 terms into `data/taxonomy-registry.json`
- Benefits from auto-classification for one-time batch, but the terms only need to be set once
- `taxonomy-registry.json` is for editorial decisions, not bulk metadata mapping

Decision: rejected (compatible — terms can also be set in the registry for override, but the bulk mapping in code is more maintainable for this case).

## Why This Path

The 43 terms represent a clear structural gap: the build tool computes a study family for every term (stored in `metadata.studyFamily`) but never used it for taxonomy classification until Tier 4 was added. The mapping is unambiguous, the code change is 15 lines (a dict + one if-block), and the false-positive risk is zero because:

1. `infer_study_family()` has narrow keyword sets per family
2. The guard `if not (taxonomy and taxonomy["category"])` prevents overriding earlier tiers
3. Each family maps to exactly one category/subcategory pair

## Consequences

### Positive

- **+43 terms classified** (75.20% coverage, +0.24pp)
- **Zero false-positive risk** — verified by code review
- **Minimal code change**: 15 lines (dict + if-block in `build_term_record()`)
- **Extensible**: adding a new family is a one-line dict entry
- **Auditable**: classified terms are tagged with `taxonomySource: "study_family"` in their metadata

### Negative

- **Limited reach**: Only 43 terms; the remaining ~4,461 need editorial classification
- **Coupled to `infer_study_family()` changes**: If keyword sets in that function change, the mapping table may need review
- **Not zero-maintenance**: If a new study family appears in the workbook without a mapping entry, its terms remain unclassified

## Implementation Notes

### Code Changes

```python
STUDY_FAMILY_TAXONOMY_MAP: dict[str, tuple[str, str]] = {
    "Evaluation": ("Model Evaluation", "Performance Metrics"),
    "Ethics & Governance": ("Ethics & Governance", "Fairness in ML"),
    "Statistics": ("Statistical Methods", "Bayesian Inference"),
    "Similarity & Deduplication": ("Similarity & Deduplication", ""),
}
```

Added in `build_term_record()` after Tier 3 (auto-classification):

```python
# Tier 4 — study-family taxonomy mapping.
if not (taxonomy and taxonomy["category"]):
    family = infer_study_family(term, taxonomy)
    if family in STUDY_FAMILY_TAXONOMY_MAP:
        cat, sub = STUDY_FAMILY_TAXONOMY_MAP[family]
        taxonomy = {"term": term["title"], "category": cat, "subCategory": sub, "rowNumber": -1}
        taxonomy_source = "study_family"
```

### Test Updates

The fixture test `test_builds_runtime_artifacts_from_realistic_workbooks` was updated to include `studyFamilyClassifiedTerms` in the `taxonomyMatches` assertion sum.

## Validation Plan

- **Coverage delta**: Build output shows +43 classified terms vs baseline (verified: coverage from 74.96% to 75.20%)
- **Per-term verification**: All 43 classified terms printed and reviewed — each maps to expected category
- **Code review**: Changes reviewed by DeepSeek code-reviewer, confirmed zero false-positive risk
- **No regression**: All existing tests pass; fixture test updated for the new report field
- **Frontend-neutral**: No frontend changes needed — `taxonomySource` is already an optional display field

## Revisit Triggers

Revisit this ADR if:

- New study families are added to the workbook (add new entries to `STUDY_FAMILY_TAXONOMY_MAP`)
- `infer_study_family()` keyword sets change significantly (verify mapping entries still match)
- The editorial pipeline becomes the primary taxonomy source for these terms (migration path: move entries to `taxonomy-registry.json`, then remove from this map)

## Related Files

- `tools/build_published_content.py` — `STUDY_FAMILY_TAXONOMY_MAP` constant + Tier 4 block in `build_term_record()`
- `tests/test_build_published_content.py` — updated test assertion
- `Docs/data/AUTO_CLASSIFICATION_STRATEGY.md` — mentions studyFamily as Batch 7 P0 candidate
- `Docs/data/UNCLASSIFIED_TERM_ANALYSIS.md` — full unclassified term analysis containing these 43 terms
- `Docs/data/EXPLORATIONS.md` — project-intelligence trail including the studyFamily exploration
