# Canonical Term Schema

Date: 2026-06-29
Status: Proposed runtime contract
Evidence basis: Verified glossary inventory sheet plus verified editorial structure sheet

## Why This Exists

The source sheets are structurally mismatched:

- the glossary sheet is a term inventory with taxonomy
- the structure sheet is an editorial blueprint with hundreds of possible fields

The app needs one canonical runtime contract between:

- import pipeline
- JSON content packs
- frontend renderers
- user note and annotation anchors

## Design Rules

1. Keep the runtime schema compact.
2. Preserve room for deeper editorial content later.
3. Make annotation anchors stable.
4. Separate learner-facing blocks from deep metadata.
5. Keep the schema file-friendly and CDN-friendly.

## Canonical JSON Shape

```json
{
  "id": "activation-function",
  "slug": "activation-function",
  "title": "Activation Function",
  "aliases": [
    "nonlinearity"
  ],
  "summary": "A function applied to a neuron output to introduce non-linearity.",
  "taxonomy": {
    "topic": "Activation Function",
    "category": "Neural Networks",
    "subCategory": "Components",
    "tags": [
      "deep-learning",
      "nn-basics"
    ]
  },
  "links": {
    "prerequisites": [
      "perceptron",
      "linear-model"
    ],
    "related": [
      "relu",
      "sigmoid-function",
      "tanh"
    ],
    "alternatives": [],
    "next": [
      "backpropagation"
    ]
  },
  "blocks": [
    {
      "id": "definition",
      "type": "markdown",
      "title": "Definition and Overview",
      "body": "Activation functions define how neural units transform incoming signals."
    },
    {
      "id": "key-concepts",
      "type": "bullets",
      "title": "Key Concepts",
      "items": [
        "Introduces non-linearity",
        "Affects gradient flow",
        "Changes representational capacity"
      ]
    },
    {
      "id": "how-it-works",
      "type": "steps",
      "title": "How It Works",
      "steps": [
        {
          "label": "Input aggregation",
          "body": "Combine weighted inputs and bias."
        },
        {
          "label": "Transformation",
          "body": "Apply the activation function."
        }
      ]
    },
    {
      "id": "diagram",
      "type": "mermaid",
      "title": "Flow",
      "source": "graph TD; A[Weighted Sum] --> B[Activation];"
    }
  ],
  "metadata": {
    "difficulty": "beginner",
    "maturity": "evergreen",
    "implementationComplexity": "low",
    "researchMaturity": "high",
    "lastReviewedAt": "2026-06-29"
  },
  "source": {
    "glossarySheet": {
      "sheetName": "main",
      "rowNumber": 5
    },
    "structureTemplateVersion": "2026-06-29"
  }
}
```

## Top-Level Fields

### `id`

- immutable identifier
- kebab-case
- generated once and preserved

### `slug`

- public URL segment
- usually equal to `id`
- may diverge if content or URL migrations ever require aliasing

### `title`

- learner-facing canonical display title

### `aliases`

- list of variant names, abbreviations, alternate capitalization, and synonyms

### `summary`

- short learner-facing explanation
- should be usable in cards, SEO snippets, and search results

### `taxonomy`

- verified launch foundation from glossary sheet
- powers browse, collections, and related navigation

### `links`

- explicit semantic graph between terms
- should not rely only on taxonomy similarity

### `blocks`

- ordered learner-facing content blocks
- frontend renders these compositionally

### `metadata`

- deep fields used for filters, ranking, ops, and future premium depth

### `source`

- preserves traceability back to source sheets and later editorial revisions

## Allowed Block Types

V1 block registry:

- `markdown`
- `bullets`
- `steps`
- `table`
- `callout`
- `mermaid`
- `diagram`
- `faq`
- `quiz`
- `references`

Rules:

- all blocks need stable `id`
- all blocks need a `title` unless intentionally hidden
- frontend should ignore unknown block types safely

## Runtime Validation Rules

Required:

- `id`
- `slug`
- `title`
- `taxonomy.category`
- `taxonomy.subCategory`
- at least one content block

Recommended:

- `summary`
- `links.related`
- `links.prerequisites`
- `metadata.difficulty`

## Publication Strategy

Recommended published artifacts:

- `content/published/terms/index.json`
- `content/published/terms/manifest.json`
- `content/published/terms/shards/<shard-id>.json`
- `content/published/taxonomy/category-tree.json`
- `content/published/search/search-index.json`
- `content/published/reports/canonicalization-groups.json`
- `content/published/reports/content-audit.json`

## Structure Workbook Role

The structure workbook is intentionally not the runtime schema.

It now serves as an editorial blueprint that the importer classifies into:

- launch-runtime sections
- editorial-expansion sections
- backlog sections

That classification is emitted in `content/published/editorial/structure-registry.json` so the product can stay JSON-first without pretending every structure field belongs in the same public contract.

The same layer counts are also mirrored in `content/published/reports/import-report.json` so corpus growth and editorial ceiling stay visible in one place.

The runtime-facing subset is further published as `content/published/editorial/launch-contract.json`, which maps launch sections onto the current block set and keeps the launch surface explicit.

## Why This Contract Is Right

- it supports a rich learning UI
- it avoids turning the runtime into a 689-column spreadsheet mirror
- it gives the note/annotation system stable block anchors
- it keeps content portable and testable

## Addendum (2026-06-30)

- The generated runtime now leans on graph-aware content blocks instead of only a summary plus a generic block trio.
- Published terms should include at least:
  - an overview paragraph
  - field-position context
  - a connection map pulled from the glossary graph
  - step-based study prompts tuned by taxonomy and link structure
- When a source taxonomy row is missing, the term title still becomes the runtime `topic` label so the page never feels blank or anonymous.
- A coarse `metadata.studyFamily` hint can be derived from the title graph or taxonomy so browse and study surfaces still have a broad anchor even when the source sheet is sparse.
- The study-family hint is intentionally coarse and should prefer broad learning families over overly narrow or misleading guesses.
- This keeps the corpus JSON-first while making the content feel like an actual learning surface instead of a raw index.
- The importer now also emits a `content-audit.json` report that rechecks title/source traceability, required block presence and order, source-definition parity, and other corpus integrity signals at build time.
