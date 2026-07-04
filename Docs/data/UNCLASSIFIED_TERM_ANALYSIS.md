# Unclassified Term Analysis

Date: 2026-07-04
Status: Analysis complete — no code changes made

## Summary

After 6 batches of auto-classification rules + Tier 4 study-family mapping, **4,461 terms remain unclassified** (24.8% of 17,988). This document profiles those terms to determine the best path forward.

## Coverage State

| Metric | Value |
|---|---|
| Total terms | 17,988 |
| Classified | 13,527 (75.20%) |
| Unclassified | **4,461** (24.80%) |
| Total rules | 369 |

## Unclassified Term Categories

### Category 1: Named Entities (~45%, ~2,000 terms)

Datasets, tools, vendors, papers, and platforms. These have high token frequency but are not suitable for keyword rules because they span multiple categories.

**High-frequency named entities:**
| Token | Occurrences | Example |
|---|---|---|
| NVIDIA | 21 | Jasper (NVIDIA), Kaolin (NVIDIA) |
| Amazon | 15 | Amazon Braket SDK, Amazon CodeWhisperer |
| Google | 12 | Gemma (Google), Google PaLM API |
| OpenAI | 11 | Azure OpenAI Service, OpenAI Evals |
| IBM | 6 | IBM Diffprivlib, IBM Watson Discovery |
| RAPIDS | 5 | CuDF (RAPIDS), CuGraph (RAPIDS) |
| RWKV | 5 | RWKV, RWKV-4-arch |

### Category 2: Generic/Noise Terms (~25%, ~1,100 terms)

High-frequency words that appear across all categories. Cannot be used as rules without massive false positives.

**Noise tokens:**
| Token | Occurrences | Why Not Usable |
|---|---|---|
| model | 87 | Appears in every category |
| learning | 67 | Too broad |
| techniques | 59 | Too broad |
| data | 38 | Too broad |
| extensions | 30 | Too broad |

### Category 3: Low-Volume Technical Terms (~20%, ~890 terms)

Domain-specific patterns appearing in < 10 terms each. Suitable for editorial classification rather than individual rules.

### Category 4: Best Remaining Rule Candidates (~10%, ~450 terms)

Tokens that are category-predictive and don't overlap with existing rules.

| Token | Terms | Proposed Category | Risk |
|---|---|---|---|
| `matrix` | 16 | Linear Algebra / Matrix Operations | Low — all matrix operations in AI context |
| `entropy` | 8 | Loss Functions / Classification Loss | Low — entropy minimization, cross-entropy |
| `prompt` | 14 | NLP / Language Generation | Low — prompt engineering, prompt selection |
| `inverse` | 11 | Neural Networks / Training Techniques | Low — inverse dynamics, inverse RL |
| `exponential` | 8 | Statistical Methods / Bayesian Inference | Medium — exponential can appear in "exponential family" (stats) or "exponential moving average" (signal) |
| `teacher student` | 5 | Learning Paradigms / Low-Data Learning | Low — distinct multi-word pattern |
| `neuro symbolic` | 5 | AI Theory / Knowledge Representation | Very low — clean multi-word pattern |
| `kalman filter` | 5 | Statistical Methods / Bayesian Inference | Low — specific named technique |
| `variational` | 3 | Statistical Methods / Bayesian Inference | Low — already well-covered |
| `factorization` | 4 | Dimensionality Reduction / Feature Reduction | Low — matrix factorization variants |

**Estimated total from above:** ~78 terms at ~8 terms/rule — marginal ROI.

## Recommendation

The auto-classification rule engine has reached its practical limit. The remaining 4,461 terms should be handled through the editorial pipeline:

1. **Taxonomy-registry.json** for named entities (~3,500 terms) — bulk LLM-assisted classification with human review
2. **StudyFamily metadata** for remaining metadata-backed terms (~43 already done)
3. **Hard-200 pending terms** (~150 remaining from the hard-200 list) — expert manual review

## Appendices

### Appendix A: Top 40 Tokens in Unclassified Terms

```
models x97, model x87, learning x67, for x66, techniques x59,
dataset x40, data x38, plus x38, rule x36, base x34,
parser x34, and x32, based x31, extensions x30, random x25,
function x24, with x23, modeling x22, moe x22, deep x21,
adaptive x21, validation x21, nvidia x21, rules x20,
architecture x19, context x19, linear x19, act x18, split x17,
variable x17, batch x16, matrix x16, aware x16, routing x15,
amazon x15, loop x15, value x15, multi x15, representations x14
```

### Appendix B: Category Distribution of Classified Terms

| Category | Terms |
|---|---|
| AI Applications | 1,947 |
| Neural Networks / Core Models | 1,371 |
| Natural Language Processing / Text Preprocessing | 741 |
| Data Preprocessing / Data Enhancement | 639 |
| ... (full distribution available in content-audit.json) | |
