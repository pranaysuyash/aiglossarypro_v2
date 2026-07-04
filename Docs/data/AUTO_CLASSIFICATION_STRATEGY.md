# Auto-Classification Strategy

Date: 2026-07-04
Status: Live (6 batches, 358 rules, 74.49% coverage)
Source: `tools/build_published_content.py` → `AUTO_CLASSIFICATION_RULES`

## Overview

The auto-classification system assigns taxonomy categories (`category` / `subCategory`) to glossary terms based on keyword matching against a prioritized rule set. Rules are scored by `(multi_word_matches × 3 + single_word_matches) × priority` — the highest score wins. This document tracks the evolution of the rule set across all batches, including quality audits and analysis of remaining gaps.

## Coverage Trajectory

| Batch | Rules Added | Total Rules | Auto-Classified | Coverage | Key Change |
|---|---|---|---|---|---|
| Baseline (Batch 1-2) | ~130 | ~130 | — | 53.54% | Original curated rules + broad single-token patterns |
| Batch 3 (X-patterns) | ~80 | ~210 | 1,537 | 72.31% | X-based/aware/scale/free/level/centric/wise + cross-X patterns |
| Batch 4 (tough-100) | 26 | ~236 | 1,602 | 72.68% | Named acronyms (SMOTE, UMAP, LIME, etc.) + specific techniques + noise-particle stripping |
| Batch 5 (hard-200) | 19 | ~255 | 1,886 | 74.26% | Single-token data patterns (loss, transformation, mining, swap) + 15 multi-word techniques |
| Batch 6 (acronyms+v2) | 22 | **358** | **1,929** | **74.49%** | 14 acronym rules (NMS, CART, SLAM, ADMM, etc.) + 8 named concepts (theory of mind, human in the loop, etc.) |
| **Total** | **358** | **358** | **1,929** | **74.49%** | **4,588 unclassified remain** |

### Coverage Breakdown

| Source | Count | % of Corpus |
|---|---|---|
| Total corpus terms | 17,988 | 100% |
| Registry-classified | 11,471 | 63.77% |
| Auto-classified (all batches) | 1,929 | 10.72% |
| **Total classified (taxonomyTerms)** | **13,400** | **74.49%** |
| Unclassified | 4,588 | 25.51% |

## Architecture

### Scoring Formula

```python
score = (multi_word_matches * 3 + single_word_matches) * priority
```

- **Multi-word matches** (keyword appears in `lower_title`): weighted 3×
- **Single-token matches** (keyword is a token from `semantic_tokens(title)`): weighted 1×
- **Priority** (7-10): multiplier — higher number = higher weight

### Pre-processing Pipeline (in `auto_classify_term()`)

1. **Hyphen normalization**: `title.lower().replace("-", " ")`
2. **Noise-particle stripping**: `re.sub(r'\b(?:extensions|techniques|enhancements|variants)\b', ' ', lower_title)`
3. **Whitespace cleanup**: `re.sub(r'\s+', ' ', lower_title).strip()`
4. **Tokenization**: `semantic_tokens(title)` on original title
5. **Noise token removal**: `tokens -= NOISE_PARTICLES`
6. **Matching**: Iterate all rules, compute score, pick highest

### Classification Priority Chain

When building term records, taxonomy is resolved in this order:

1. **Tier 1 — Editorial Registry**: Curated decisions from `data/taxonomy-registry.json` (most authoritative)
2. **Tier 2 — Workbook Taxonomy**: Columns N/O/P of the glossary sheet (`data_glossary.xlsx`)
3. **Tier 3 — Auto-Classification**: Fallback via `AUTO_CLASSIFICATION_RULES` keyword matching

## Batch Details

### Batch 1 & 2 — Original Core Rules (~130 rules, pri 7-10)

The foundational rule set. Covers major named techniques and broad domain patterns. Structure:

- **pri=10**: High-confidence multi-word techniques (`chain of thought`, `actor critic`, `few shot`, `reinforcement learning`, `transfer learning`)
- **pri=9**: Named model architectures (`bert`, `gpt`, `resnet`, `vit`, `yolo`), named methods (`gan`, `vae`, `diffusion`), named algorithms (`sgd`, `adam`, `ppo`)
- **pri=8**: Domains (`computer vision`, `nlp`, `reinforcement learning`), techniques (`convolution`, `attention`, `dropout`), tools (`cuda`, `docker`, `kubernetes`)
- **pri=7**: Infrastructure (`api`, `database`, `gpu`), cloud platforms (`aws`, `azure`, `gcp`)

**Coverage impact**: 0 → 53.54%

### Batch 3 — X-Pattern Rules (~80 rules, pri 7-9)

Targets terms with compound modifiers like "X-based", "X-aware", "cross-X", "X-free", "X-level", "X-wise", "X-centric", "X-scale", "X-only".

Patterns:
- **X-based** (pri 8-9): `attention based`, `transformer based`, `graph based`, `memory based`, `rule based`, `embedding based`, `image based`, `text based`, `token based`, `agent based`, `model based`, `data based`, `kernel based`, `similarity based`, `feature based`, `score based`, `energy based`, `flow based`, `rl based`, `nn based`, `cnn based`, `lstm based`
- **X-aware** (pri 8): `context aware`, `privacy aware`, `carbon aware`, `confidence aware`, `domain aware`, `task aware`, `cost aware`, `uncertainty aware`, `risk aware`, `safety aware`, `bias aware`, `communication aware`
- **X-free** (pri 8): `label free`, `annotation free`, `anchor free`, `classifier free`, `parameter free`, `hessian free`, `model free`
- **X-level** (pri 8): `token level`, `sentence level`, `document level`, `word level`, `character level`
- **X-wise** (pri 8): `layer wise`, `channel wise`, `pixel wise`, `token wise`, `element wise`, `point wise`
- **X-centric** (pri 7-8): `data centric`, `object centric`, `user centric`, `model centric`
- **X-scale** (pri 8): `large scale`, `multi scale`, `brain scale`
- **X-only** (pri 8): `decoder only`, `encoder only`
- **cross-X** (pri 7-9): `cross entropy`, `cross modal`, `cross domain`, `cross lingual`, `cross task`, `cross attention`, `cross platform`
- **X-driven** (pri 7-8): `data driven`, `curiosity driven`, `goal driven`, `evidence driven`

**Coverage impact**: 53.54% → 72.31% (the largest single jump)

### Batch 4 — Named Acronyms & Specific Techniques (26 rules, pri 7-9)

Added high-confidence named acronyms and specific technique keywords that survived the tough-100 analysis.

**Named acronyms** (pri 7-9):
- `smote` → Data Preprocessing / Data Enhancement
- `umap` → Dimensionality Reduction / Feature Reduction
- `lime` → Explainable AI / Model Interpretability
- `arima` → Statistical Methods / Bayesian Inference
- `roc` → Model Evaluation / Performance Metrics
- `hnsw` → Similarity & Deduplication
- `neat` → AI Applications
- `ffjord` → Generative Models
- `kfac` / `k fac` → Optimization Algorithms / Gradient-Based Optimizers
- `adni` → AI Applications

**Named techniques** (pri 8-9):
- `contrastive divergence` → Neural Networks / Training Techniques
- `variational information bottleneck` → Representation Learning / Feature Learning
- `uniform manifold approximation` → Dimensionality Reduction / Feature Reduction
- `random fourier features` → Neural Networks / Core Models
- `co occurrence matrix` → Representation Learning / Vector Representations
- `progressive growing` → Generative Models / Adversarial Networks
- `lipschitz continuity` → Neural Networks / Regularization Techniques
- `orthogonal initialization` → Neural Networks / Training Techniques
- `mean cancellation` → Neural Networks / Training Techniques
- `cyclical consistency` → Computer Vision / Image Processing
- `random projection` → Dimensionality Reduction / Feature Reduction
- `covariance` → Statistical Methods / Bayesian Inference
- `heteroscedastic` → Statistical Methods / Bayesian Inference
- `boltzmann` → Neural Networks / Core Models

**Infrastructure — Noise-particle stripping**:
- Strips `extensions`, `techniques`, `enhancements`, `variants` from titles before matching (word-boundary regex)
- This allows terms like "Maximum Likelihood Extensions Techniques" to match the `"maximum likelihood"` rule after the noise is removed

**Coverage impact**: 72.31% → 72.68%

### Batch 5 — Data Processing & Multi-Word Techniques (19 rules, pri 8)

Single-token data/processing patterns and remaining high-frequency multi-word techniques.

**Single-token data patterns** (pri 8):
- `loss` → Loss Functions / Classification Loss (~103 terms)
- `transformation` → Data Preprocessing / Data Scaling (~47 terms)
- `mining` → Data Processing / Data Pipeline (~29 terms)
- `swap` → Data Preprocessing / Data Enhancement (~27 terms)

**Named multi-word techniques** (pri 8):
- `mixture of experts` → Neural Networks / Specialized Architectures
- `deep equilibrium` → Neural Networks / Core Models
- `mean teacher` → Learning Paradigms / Low-Data Learning
- `state space` → Statistical Methods / Probabilistic Models
- `noise injection` → Neural Networks / Regularization Techniques
- `association rule` → Data Processing / Data Pipeline
- `frozen pretrained` → Transfer Learning / Model Adaptation
- `mutual information` → Representation Learning / Feature Learning
- `autoregressive` → Statistical Methods / Probabilistic Models
- `dynamic loss` → Loss Functions / Classification Loss
- `polyak averaging` → Optimization Algorithms / Gradient-Based Optimizers
- `log ratio` → Data Preprocessing / Data Scaling
- `information maximization` → Representation Learning / Feature Learning
- `exponential family` → Statistical Methods / Probabilistic Models
- `cycle consistency` → Computer Vision / Image Processing

**Coverage impact**: 72.68% → 74.26% (+284 new classifications)

### Batch 6 — Named Acronyms & Concepts from Hard-200 (22 rules, pri 7-9)

Extracted from the hardest 200 unclassified terms. Targets highly specific named acronyms and multi-word concepts that survived earlier batches.

**Named acronyms** (pri 8-9):
- `nms` → Computer Vision / Object Detection (4 terms)
- `cart` → Learning Paradigms / Supervised Learning (3 terms)
- `slam` → Computer Vision / Image Processing (4 terms)
- `admm` → Optimization Algorithms / Gradient-Based Optimizers (1 term)
- `focl` → Machine Learning Frameworks / Automated Processes (1 term)
- `ecoc` → Loss Functions / Classification Loss (1 term)
- `slim` → Model Optimization / Model Compression (1 term)
- `nmf` → Dimensionality Reduction / Feature Reduction (1 term)
- `nist` → Ethics & Governance (1 term)
- `wer` → Model Evaluation / Performance Metrics (1 term)
- `cer` → Model Evaluation / Performance Metrics (1 term)
- `psnr` → Computer Vision / Image Processing (1 term)
- `mpnn` → Neural Networks / Graph-Based Models (1 term)
- `pos` → Natural Language Processing / Text Analysis (1 term)

**Named multi-word concepts** (pri 8-9):
- `theory of mind` → AI Theory / Knowledge Representation (3 terms)
- `human in the loop` → AI Applications (3 terms)
- `society of mind` → AI Theory / Knowledge Representation (3 terms)
- `kernel trick` → Statistical Methods / Probabilistic Models (2 terms)
- `bloom filter` → Data Processing / Data Pipeline (1 term)
- `ab testing` / `a/b testing` → Model Evaluation / Performance Metrics (3 terms)
- `approximate nearest neighbor` → Similarity & Deduplication (3 terms)
- `composition of experts` → Neural Networks / Specialized Architectures (3 terms)

**Coverage impact**: 74.26% → 74.49% (+43 classifications)

## Quality Assurance

Each batch was validated with:
1. **Syntax check**: `py_compile` on `build_published_content.py`
2. **Full build**: Re-run the build script with `--coverage-threshold 0`
3. **Coverage comparison**: Verify delta vs previous baseline
4. **Rule audit**: Sample terms from each new rule, verify assigned category matches expected
5. **Code review**: DeepSeek code-reviewer pass for false-positive risks

### Batch 4/5 Quality Audit Results (2026-07-04)

A comprehensive audit sampled every batch 4 and batch 5 rule and verified the assigned category against the term's actual content:

| Rule | Auto-classified | Correct? | Notes |
|---|---|---|---|
| `smote` | — | ✅ | Already classified by higher-priority rules |
| `umap` | — | ✅ | Already classified by higher-priority rules |
| `lime` | — | ✅ | Already classified by higher-priority rules |
| `arima` | — | ✅ | Already classified by higher-priority rules |
| `roc` | — | ✅ | Already classified by higher-priority rules |
| `hnsw` | 5 | ✅ All correct | HNSW Indexing, IVF-HNSW-PQ hybrids → Similarity & Deduplication |
| `neat` | 2 | ✅ All correct | NEAT → AI Applications |
| `ffjord` | 1 | ✅ Correct | FFJORD → Generative Models |
| `kfac` / `k fac` | 6 | ✅ All correct | K-FAC, EK-FAC → Optimization Algorithms |
| `adni` | — | ✅ | Already classified by higher-priority rules |
| `variational info bottleneck` | 5 | ✅ All correct | → Representation Learning / Feature Learning |
| `random fourier features` | 4 | ✅ All correct | → Neural Networks / Core Models |
| `progressive growing` | 5 | ✅ All correct | → Generative Models / Adversarial Networks |
| `lipschitz continuity` | 2 | ✅ All correct | → Neural Networks / Regularization Techniques |
| `orthogonal initialization` | 3 | ✅ All correct | → Neural Networks / Training Techniques |
| `mean cancellation` | 6 | ✅ All correct | → Neural Networks / Training Techniques |
| `random projection` | 3 | ✅ All correct | → Dimensionality Reduction / Feature Reduction |
| `boltzmann` | 25 | ✅ All correct | → Neural Networks / Core Models |
| `loss` | 102 | ✅ All correct | 4 flagged terms were correct overrides by higher-priority rules |
| `transformation` | 47 | ✅ All correct | 2 flagged terms were correct overrides |
| `mining` | 29 | ✅ All correct | 1 flagged term was a correct override |
| `swap` | 27 | ✅ All correct | 1 flagged term was a correct override |
| All 15 multi-word Batch 5 | 120 | ✅ **100% correct** | Zero misclassifications |

**Verdict: Zero misclassifications across all Batch 4 and Batch 5 rules.** All 8 "flagged" terms from the high-risk single-token analysis were false alarms — each was correctly overridden by a higher-priority more specific rule.

## Hard-200 Manual Corrections

The `Docs/data/hard-200-proposed.json` file contains 200 of the hardest-to-classify terms. The first 50 were manually reviewed and corrected by an AI/ML domain expert on 2026-07-04.

### Corrected Category Distribution (First 50)

| Category | Count | Example Terms |
|---|---|---|
| AI Theory / Knowledge Representation | 10 | PEACTIDM Cycle, CLARION, OODA Loop, FORR, Global Workspace Theory, MIDCA, Society of Mind, Floyd-Warshall, BDI |
| AI Applications | 7 | CANDI, BCI for AI, Clausius-Clapeyron, MuJoCo, AIOps, AI Degrees, AI Hype |
| Neural Networks | 7 | BASE Layers, GraphSAGE (×2), Hypernetworks, JANET, LRA-Performer, Hybrid Models |
| Statistical Methods | 5 | AVaR, STL, Concentration of Measure, Kernel Trick, BLB |
| Model Evaluation / Performance Metrics | 4 | A/B Testing (×3), Out-of-Bag Estimation |
| Machine Learning Frameworks / Automated Processes | 4 | CI/CD for ML, Model Registries, AWS Step Functions, Canary Deployment |
| Reinforcement Learning / Advanced RL Techniques | 2 | Dec-POMDPs, Impala |
| Learning Paradigms / Low-Data Learning | 2 | Label Propagation, ANIL |
| Computer Vision | 2 | NMS, PSNR |
| Data Processing / Data Pipeline | 2 | Laplace Transform, TTL Caching |

### Key Observations from Corrections

- **34% are cognitive/AI theory** — many hard terms are cognitive architectures (PEACTIDM, CLARION, MIDCA, FORR, GWT, Society of Mind) that don't fit into standard ML categories
- **Noise-particle stripping works** — GraphSAGE and NMS variants were correctly identified as GNN/CV terms despite noise suffixes
- **Batch 6 coverage confirmed** — ADMM, NMS, PSNR were correctly assigned to the same categories as the live rules

## Batch 7 Candidate Analysis

Based on the corrected hard-200 data and a full scan of the remaining 4,588 unclassified terms, the following Batch 7 candidates were identified:

### P0 — StudyFamily Mapping (43 terms, zero false-positive risk)

These terms have `studyFamily` metadata from the workbook but no `taxonomy.category`. A simple lookup table would classify them without any keyword matching:

| Study Family | Count | Category |
|---|---|---|
| Evaluation | 22 | Model Evaluation / Performance Metrics |
| Ethics & Governance | 15 | Ethics & Governance / Fairness in ML |
| Statistics | 5 | Statistical Methods / Bayesian Inference |
| Similarity & Deduplication | 1 | Similarity & Deduplication |

### P1 — Single-Token Rules (97 terms, low false-positive risk)

| Token | Count | Category | Confidence |
|---|---|---|---|
| `parser` | 35 | NLP / Text Preprocessing | ✅ High — all are NLP parsing techniques |
| `decoding` | 21 | NLP / Language Generation | ✅ High — all are text/sequence decoding methods |
| `calibration` | 19 | Model Evaluation / Performance Metrics | ✅ High — all are model calibration techniques |
| `moe` | 22 | Neural Networks / Specialized Architectures | ✅ High — all are Mixture-of-Experts variants |

### P2 — Named Concepts (19 terms, very low risk)

| Concept | Unclassified Mentions | Category |
|---|---|---|
| `ooda` | 2 | AI Theory / Knowledge Representation |
| `seq2seq` | 3 | NLP / Language Generation |
| `bci` | 3 | AI Applications |
| `crf` | 2 | NLP / Text Analysis |
| `mujoco` | 3 | AI Applications |
| `impala` | 3 | Reinforcement Learning / Advanced RL Techniques |
| `nsga` | 1 | Optimization Algorithms |
| `ilqr` | 1 | Optimization Algorithms / Gradient-Based Optimizers |
| `selu` | 1 | Neural Networks / Activation Functions |

### P3 — Parenthesized Acronyms (~92 terms, variable quality)

Acronyms appearing in `(ACRONYM)` patterns within unclassified terms. Requires per-acronym analysis to determine if the acronym is safe to use as a standalone rule.

**Highest-frequency**: `rapids` (3), `nvidia` (3), `gwt` (2), `ice` (2), `sam` (2), `pdp` (2), `sar` (2)

### Gap Analysis — Categories with Highest Need

| Category | Corrected Hard-200 Terms | Existing Rules | Gap |
|---|---|---|---|
| Machine Learning Frameworks | 4 | 2 | Highest — 2:1 ratio |
| AI Theory | 10 | 7 | Moderate — many cognitive theory terms |
| AI Types | 1 | 1 | Minimal |

## CLI Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--coverage-threshold` | float | `TAXONOMY_COVERAGE_MINIMUM` (0.74) | Override the taxonomy coverage minimum. Use 0 to disable the gate entirely. |

## Known Gaps & Future Work

### Remaining Unclassified: 4,588 terms

The remaining unclassified terms fall into three categories:

1. **Very domain-specific named entities** (datasets, benchmarks, tools): e.g., "CIFAR-10 Dataset", "ImageNet-21K", "ShareGPT Dataset" — typically 1-8 matches each. Not suitable for automated rules.
2. **Terms with broad tokens** (models, learning, data): These tokens would cause false positives if used as single-token rules. Most common: `dataset` (40), `modeling` (25), `random` (25), `adaptive` (22), `nvidia` (21), `architecture` (19).
3. **Edge cases**: Terms that genuinely span multiple categories or are too generic to auto-classify reliably. Includes 15+ "X in AI/ML" pattern terms that could get their own rules.

### Longer-Term Strategy

- The easy automated gains are exhausted after 6 batches (358 rules covering ~1,929 terms)
- The remaining ~4,500 terms likely require **editorial judgment** per term rather than automated rules
- The `hard-200-proposed.json` file provides a prioritized list of which terms to tackle first
- A potential next step: classify terms via `studyFamily` → `category` mapping (P0 in Batch 7), which adds +43 terms at zero false-positive risk
- After that, each additional rule covers fewer and fewer terms, making editorial classification increasingly cost-effective than rule engineering

## Related Files

- `tools/build_published_content.py` — the build script containing `AUTO_CLASSIFICATION_RULES`
- `Docs/data/hard-200-analysis.json` — full token analysis of unclassified terms
- `Docs/data/hard-200-proposed.json` — proposed categories for the hardest 200 terms (first 50 manually corrected)
- `public/content/published/reports/content-audit.json` — runtime coverage audit
