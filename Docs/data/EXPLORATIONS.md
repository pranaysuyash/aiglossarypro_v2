# Auto-Classification Exploration Trail

Date: 2026-07-04
Status: Batch 6 complete, Tier 4 study-family mapping live

This document is a running project-intelligence trail for the auto-classification system in `tools/build_published_content.py`. It captures explorations, findings, decisions, and analyses that would otherwise live only in chat.

---

## 1. Exploration Index

| Date | Topic | Findings | Status |
|---|---|---|---|
| 2026-07-01 | hard-200 analysis | 200 hardest-to-classify terms profiled by type | Saved to `hard-200-analysis.json` |
| 2026-07-02 | Batch 5 candidate analysis | `autoregressive`, `state space`, `loss` rules identified | Implemented |
| 2026-07-03 | Batch 6 candidate analysis | ~22 acronym rules from hard-200 | Implemented |
| 2026-07-03 | Coverage decay curve | Terms/rule declining exponentially (19 → 2) | Documented in `AUTO_CLASSIFICATION_STRATEGY.md` |
| 2026-07-04 | Study-family terms | 43 unclassified terms with studyFamily metadata | Implemented as Tier 4 |
| 2026-07-04 | Unclassified term profile | 4,461 remaining terms analyzed by token frequency | Saved to `UNCLASSIFIED_TERM_ANALYSIS.md` |
| 2026-07-04 | Frontend accessibility | All Batch 4/5 terms accessible via browse/search/taxonomy | Verified |

---

## 2. Key Findings by Batch

### Batches 1-3 (Original + LLM-derived + X-patterns)
- ~210 rules covering ~1,537 terms
- High-volume patterns: neural/graph/attention/bayesian single tokens, X-based/X-aware multi-word

### Batch 4 (Hard-200 acronyms)
- ~27 rules, ~65 terms covered
- Named acronyms: SMOTE, UMAP, LIME, ARIMA, ROC, kfac
- Named techniques: contrastive divergence, variational information bottleneck
- **Efficiency**: ~2.4 terms/rule — sharp drop from Batch 3

### Batch 5 (Data processing + multi-word techniques)
- 19 rules, ~284 terms covered
- Broad single-token rules still available: `loss` (102 terms), `transformation` (47)
- Named techniques: mixture of experts, state space, autoregressive
- Created new learning path: `statistical-methods-probabilistic-models`
- **Efficiency**: ~14.9 terms/rule (anomalous spike from broad tokens)

### Batch 6 (Hard-200 v2 + moderate-confidence tokens)
- 29 rules, ~127 terms covered
- 14 named acronyms: NMS, CART, SLAM, ADMM, WER, CER, PSNR, etc.
- 4 moderate-confidence single tokens: calibration, sequence, decomposition, decoding
- 3 architecture patterns: bottleneck, projection, backbone
- **Efficiency**: ~4.4 terms/rule — exhausted broad tokens

### Tier 4 (Study-family mapping)
- 4 mappings, 43 terms classified
- Zero false-positive risk (metadata-driven, not keyword heuristic)
- Coverage: 74.96% → 75.20%

---

## 3. Coverage Decay Curve

| Batch | Rules | Terms Added | Cumulative | Terms/Rule |
|---|---|---|---|---|
| Batches 1-3 | ~210 | ~1,537 | ~1,537 | ~7.3 |
| Batch 4 | ~27 | ~65 | ~1,602 | ~2.4 |
| Batch 5 | 19 | ~284 | ~1,886 | ~14.9 |
| Batch 6 | 29 | ~127 | ~2,013 | ~4.4 |
| Tier 4 | 4 | 43 | ~2,056 | ~10.8 |

Broad single-token rules (`loss`, `transformation`) are now exhausted. Remaining unclassified terms are predominantly named entities (datasets, tools, vendors) that cannot be safely auto-classified.

---

## 4. Remaining Gaps

1. **4,461 unclassified terms** — ~3,500 named entities suitable for taxonomy-registry.json editorial pipeline
2. **~10 low-effort token rules** (< 10 terms/rule each, ~78 total) — optional marginal gain
3. **Committed artifacts stale** — `public/content/published/` reflects initial commit, not batch changes (18,519 files differ)
4. **Two pre-existing test failures** — fixture workbook limitation, path count drift

---

## 5. Open Questions / Future Directions

- Should the taxonomy-registry.json be the primary path for remaining unclassified terms (editorial bulk classification)?
- Should the hard-200 pending terms be manually reviewed as a priority queue?
- Is the auto-classification system frozen, or should we accept < 5 terms/rule for future batches?
