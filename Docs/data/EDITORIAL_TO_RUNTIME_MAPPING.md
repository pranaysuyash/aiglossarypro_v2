# Editorial to Runtime Mapping

Date: 2026-06-29
Status: Proposed import contract

## Goal

Translate the wide `Sheet2` editorial blueprint into a bounded set of runtime blocks and metadata fields.

## Principle

Do not treat every editorial field as a first-class launch UI element.

Instead:

- preserve the editorial superset in source/normalized data
- publish only the subset that drives a strong learner experience

## Launch Runtime Block Registry

### `summary`

Maps from:

- `Introduction - Definition and Overview`
- `Introduction - Key Concepts and Principles`

### `importance`

Maps from:

- `Introduction - Importance and Relevance in AI/ML`

### `history`

Maps from:

- `Introduction - Brief History or Background`
- `Historical Context - *`

### `taxonomy`

Maps from:

- `Introduction - Category and Sub-category of the Term - *`
- glossary taxonomy columns `N:P`

Priority:

1. glossary `N:P`
2. structure-sheet editorial fallback

### `prerequisites`

Maps from:

- `Prerequisites - *`
- `Related Concepts - Linked Terms and Concepts - Prerequisites or Foundational Topics`

### `theory`

Maps from:

- `Theoretical Concepts - *`

### `how_it_works`

Maps from:

- `How It Works - *`

### `variants`

Maps from:

- `Variants or Extensions - *`

### `applications`

Maps from:

- `Applications - *`
- `Case Studies - *`
- `Industry Insights - *`

### `implementation`

Maps from:

- `Implementation - *`
- `Hands-on Tutorials - *`
- `Tools and Frameworks - *`

### `evaluation`

Maps from:

- `Evaluation and Metrics - *`
- `Real-world Datasets and Benchmarks - *`

### `advantages_limitations`

Maps from:

- `Advantages and Disadvantages - *`
- `Common Challenges and Pitfalls - *`

### `ethics`

Maps from:

- `Ethics and Responsible AI - *`
- `Metadata - Governance and Compliance - Ethical Considerations`

### `related_terms`

Maps from:

- `Related Concepts - *`
- `Metadata - Related Terms - Term Relationships`

### `further_reading`

Maps from:

- `Further Reading - *`
- `Research Papers - *`
- `Recommended Websites and Courses - *`

### `faq`

Maps from:

- `FAQs - *`
- `Did You Know? - Common Misconceptions or Myths`

## Metadata Registry

These fields should usually stay in `metadata`, not in primary reading flow:

- computational characteristics
- model architecture details
- licensing information
- deployment details
- MLOps considerations
- localization suggestions
- metadata quality
- support environment
- maintenance and support

## Import Priorities

### Launch required

- title
- aliases
- taxonomy
- summary
- at least 4 learner blocks

### Launch recommended

- prerequisites
- related terms
- applications
- further reading

### Later premium depth

- interviews
- career guidance
- industry trend charts
- localization variants
- metadata quality dashboard

## Rendering Rule

Every block is optional except:

- `summary`
- at least one of `theory`, `how_it_works`, or `applications`

This keeps the renderer resilient while editorial depth grows over time.

## Addendum (2026-06-30)

- The published content pipeline now renders `study-prompts` as a true `steps` block instead of a plain bullet list.
- That gives each term a visible study sequence:
  - situate it
  - define it
  - trace the graph
  - record an example
- The intent is to make the runtime feel teachable and action-oriented without widening the schema into the full 689-field editorial blueprint.

## Addendum (2026-07-01 Interactive Blocks)

- The published term runtime now includes two new universal learning surfaces:
  - `at-a-glance` as a compact visual table for fast scanning
  - `concept-map` as a lightweight diagram-style learning map
  - `quick-quiz` as a self-check block with answer reveal and explanation
- This means quizzes are no longer only a future premium-layer idea; the basic learning loop now includes interactive recall on every published term.
- Richer interactive blocks can still be reserved for featured or premium terms later, but the core corpus now has native interactivity instead of only prose and lists.

## Addendum (2026-07-01 Featured Depth Tier)

- The importer now tags terms with an editorial tier so the UI can distinguish `featured`, `standard`, and `sparse` depth.
- Featured terms receive an additional `deep-dive` block that turns the source/graph signals into a more visual study panel:
  - core idea
  - where it sits in the family
  - what to compare it with
  - how to move to the next concept
  - a memory hook
- This is the right place for the first wave of infographic-style learning depth because it makes stronger terms feel more authored without forcing the entire corpus into a heavy CMS-like shape.
