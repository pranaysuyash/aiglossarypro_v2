# Content Authoring Playbook

Date: 2026-07-01
Purpose: define how to grow the AI/ML learning corpus without turning the product into a CMS or flattening every term into the same depth level.

## Current Content Reality

- Published terms: `17,988`
- Editorial tiers:
  - `featured`: strongest candidates for visual depth
  - `standard`: compact launch stack with selective enrichment
  - `sparse`: valid, browsable, but intentionally lighter
- Universal runtime blocks now include:
  - `overview`
  - `taxonomy`
  - `connections`
  - `study-prompts`
  - `why-it-matters`
  - `comparison-notes`
  - `recall-drill`
  - `at-a-glance`
  - `visual-summary`
  - `concept-map`
  - `quick-faq`
  - `quick-quiz`
- Richer selective layers now include:
  - `comparison`
  - `deep-dive`

## Authoring Goal

Make the best concepts feel taught, not merely listed.

The corpus should answer:

- what this term is
- what it is not
- why it matters
- what it connects to
- how to study it next
- where the learner most often confuses it with neighbors

## Selection Rules For Richer Depth

Promote a term into deeper treatment when at least one of these is true:

- it has strong taxonomy signal
- it has a definition block or source-backed summary
- it has meaningful prerequisite/related/next links
- it anchors a curriculum path
- it is a common confusion point
- it is a flagship concept learners will revisit repeatedly

Use `featured` only when the extra depth is earned.

## Recommended Block Stack

### All terms

Keep the compact runtime stack stable:

- `overview`
- `taxonomy`
- `connections`
- `study-prompts`
- `why-it-matters`
- `comparison-notes`
- `recall-drill`
- `at-a-glance`
- `visual-summary`
- `concept-map`
- `quick-faq`
- `quick-quiz`

### Featured terms

Add richer surfaces:

- `comparison`
- `deep-dive`

### Path pages and cluster pages

Use the strongest visual treatment here:

- path anchor cards
- featured comparisons
- infographic-like deep dives
- curriculum entry rails

## Writing Style

- Prefer concrete learner moves over abstract marketing copy.
- Prefer “compare this to X” over long background digressions.
- Prefer one crisp example over several vague examples.
- Prefer honest sparse wording over inflated pseudo-completeness.
- Prefer first-principles explanations over jargon compression.

## Editorial Checkpoints

Before promoting or expanding a concept, check:

- title accuracy
- alias accuracy
- taxonomy placement
- source traceability
- link quality
- whether the term is being confused with nearby concepts
- whether the term really deserves featured treatment

## Next Authoring Queue

The next high-value content pass should concentrate on:

1. Transformer and attention families
2. Retrieval and RAG families
3. Evaluation and metrics
4. Optimization and training dynamics
5. Data representation and feature engineering
6. Computer vision anchor concepts

These are the families most likely to benefit from comparisons, diagrams, and quiz-heavy treatment.

## Addendum (2026-07-01 Family-Aware Depth)

- The generator now carries family-specific authoring cues for:
  - Neural Networks
  - Natural Language Processing
  - Computer Vision
  - Reinforcement Learning
  - Statistics
  - Evaluation
  - Ethics & Governance
  - Similarity & Deduplication
- These cues shape the comparison, quiz, at-a-glance, FAQ, and deep-dive blocks so flagship families read like distinct learning surfaces instead of one generic template.
- The practical intent is to make the core curriculum feel curated and teachable at the family level while keeping the long tail compact.

## Decision Record

- Decision: keep the corpus JSON-first, but make content depth tiered and selectively infographic-like.
- Why: this preserves scalability while letting the strongest learning nodes feel authored.
- Risk: over-promoting weak entries would dilute trust.
- Mitigation: use the shared block rubric and keep sparse content visibly sparse.
