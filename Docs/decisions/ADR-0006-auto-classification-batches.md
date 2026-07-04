# ADR-0006: Auto-Classification via Keyword Rules

Date: 2026-07-04
Status: Implemented (6 batches + Tier 4 study-family mapping)

## Context

The published corpus has 17,988 terms. Of these, 11,471 have taxonomy from the editorial registry, 0 from the workbook taxonomy columns, and ~6,517 were unclassified at the start of this work. The goal was to reduce the unclassified count using automated keyword-based classification rules in `tools/build_published_content.py`.

## Decision

Use a multi-batch approach of keyword rules in `AUTO_CLASSIFICATION_RULES`, applied as Tier 3 in the taxonomy resolution pipeline (after registry and workbook tiers, before study-family mapping).

## Options Considered

1. **Single monolithic rule set** — rejected: harder to test, no coverage trajectory visibility
2. **LLM-assisted bulk classification** — rejected for the auto-classification pass: preferred human-curated rules for quality
3. **Multi-batch keyword rules** — chosen: allows incremental rollout, per-batch metrics, and explicit coverage tracking
4. **Taxonomy-registry-only** — rejected for the auto pass: useful for editorial curation but slower for bulk coverage

## Chosen Path

Six batches of keyword rules:

- **Batches 1-3**: Original curated rules + LLM-derived broad patterns + X-pattern multi-word rules (~210 rules, ~1,537 terms)
- **Batch 4**: Named acronyms from the hard-200 analysis (27 rules, ~65 terms)
- **Batch 5**: Data processing tokens + high-frequency multi-word techniques (19 rules, ~284 terms)
- **Batch 6**: Hard-200 v2 acronyms + moderate-confidence single tokens (29 rules, ~127 terms)
- **Tier 4**: Study-family metadata mapping (4 mappings, 43 terms)

## Tradeoffs

- **Pros**: Fully automated, zero human effort per term, reproducible, testable
- **Cons**: Diminishing returns per batch, cannot handle named entities, risk of false positives from broad tokens

## Assumptions

1. Keyword matching with priority scoring is sufficient for the long tail of technical terms
2. Named entities (datasets, tools, vendors) are better handled editorially
3. 75%+ coverage is an acceptable stopping point for the automated pass

## Risks

1. **False positives**: Mitigated by priority scoring (Tier 1-2 override auto-rules), word-boundary token matching, and noise-particle stripping
2. **New path drift**: Batch 5 created a new learning path that doesn't exist in committed artifacts — artifacts need rebuilding
3. **Fixture test breakage**: The synthetic fixture test doesn't produce enough data for some assertions — pre-existing issue

## Validation

- Full build: EXIT 0
- Coverage metrics tracked per batch
- Frontend accessibility verified for all Batch 4/5 terms
- Path correctness verified across all 83 paths (zero category mismatches)
- Test suite: 35/35 frontend pass, 10/12 Python pass (2 pre-existing failures)

## Rollback Path

Revert `AUTO_CLASSIFICATION_RULES` additions in `tools/build_published_content.py`. The Tier 4 study-family mapping is a separate block and can be reverted independently.

## When to Revisit

If editorial classification via taxonomy-registry.json reaches 85%+ coverage, consider removing or reducing auto-classification rules to simplify the pipeline.
