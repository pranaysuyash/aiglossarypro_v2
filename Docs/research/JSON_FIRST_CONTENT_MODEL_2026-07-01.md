# JSON-First Content Model

Date: 2026-07-01
Purpose: define the durable content contract for the AI/ML learning app so the spreadsheet sources, importer, published JSON, and frontend all speak the same language.

## Source Evidence

- glossary workbook export: `data_glossary.xlsx` tab `main`
- structure workbook export: `data_structure.xlsx` tab `Sheet2`
- importer: `tools/build_published_content.py`
- published corpus: `public/content/published`
- audit: `public/content/published/reports/content-audit.json`

## Current Corpus Status

- Published unique normalized terms: `17,988`
- Canonicalization groups: `126`
- Source rows merged during canonicalization: `429`
- Terms with taxonomy coverage: `661`
- Terms with source definition blocks: `91`
- Terms in study-family coverage: `4,928`

This means the corpus is already production-shaped as a deduped published term set, but the editorial depth is still intentionally uneven.

## Canonical Runtime Contract

The runtime term shape should stay compact and CDN-friendly:

```json
{
  "id": "activation-function",
  "slug": "activation-function",
  "title": "Activation Function",
  "aliases": [],
  "summary": "Short learner-facing explanation.",
  "taxonomy": {
    "topic": "Activation Function",
    "category": "Neural Networks",
    "subCategory": "Components",
    "tags": ["neural-networks", "components"]
  },
  "links": {
    "prerequisites": [],
    "related": [],
    "alternatives": [],
    "next": []
  },
  "blocks": [
    {
      "id": "overview",
      "type": "markdown",
      "title": "Overview",
      "body": "..."
    }
  ],
  "metadata": {
    "difficulty": "",
    "maturity": "source-imported",
    "studyFamily": "Neural Networks"
  },
  "artifact": {
    "shardId": "ac"
  },
  "source": {
    "glossaryWorkbook": {
      "file": "data_glossary.xlsx",
      "sheetName": "main",
      "inventoryRows": [1],
      "inventoryCells": ["A1"]
    }
  }
}
```

## Content Layers

### Launch runtime

These are the blocks the app should treat as always available on the term page:

- `overview`
- `taxonomy`
- `connections`
- `study-prompts`
- `why-it-matters`
- `comparison-notes`
- `recall-drill`

They are already emitted by the importer and verified by `public/content/published/reports/content-audit.json`.

### Editorial expansion

These are natural next layers for selected terms and premium-depth growth:

- `historical-context`
- `case-studies`
- `hands-on-tutorials`
- `industry-insights`
- `tools-and-frameworks`
- `further-reading`
- `research-papers`
- `career-guidance`
- `future-directions`
- `faq`

### Backlog / optional growth

These should remain optional until they prove product value:

- quizzes
- advanced comparisons
- interactive notebooks
- localization variants
- community collaboration prompts
- metadata dashboards

## Editorial Blueprint Role

The structure workbook is not the runtime schema.

It should continue to act as an editorial ceiling and block inventory:

- launch-runtime sections
- editorial-expansion sections
- backlog sections

That ceiling is an implementation map for the current corpus build, not a user-imposed limit on how much of the structure can eventually become universal.

That is already reflected in:

- `public/content/published/editorial/structure-registry.json`
- `public/content/published/editorial/launch-contract.json`

## Product Decision

Use JSON as the long-term content surface.

Why:

- it keeps the app portable across Cloudflare Workers and CDN delivery
- it makes dedupe, search, and sharding testable
- it keeps note anchors stable for bookmarks and annotations
- it avoids the complexity trap of a second CMS-like system

## Open Questions

1. Which editorial fields should become default blocks for every term beyond the current launch set?
2. Which content types should remain curated-only for featured concepts?
3. Which blocks should become reusable widgets instead of prose-only sections?
4. What is the minimum deep-editorial threshold for calling a term "fully authored"?

## Next Step

Wire the frontend to treat the published JSON corpus as the only term source of truth, then layer bookmarks, notes, shares, and exports on top of that contract.

## Addendum (2026-07-01 Published Manifest Consolidation)

- The build now emits `public/content/published/manifest.json` as the shared shell-facing corpus summary.
- The manifest consolidates term count, path count, coverage, quality checks, canonicalization, structure layers, and launch ordering so the UI does not need to stitch multiple status files together.
- The importer now preserves the launch section order intentionally, which keeps the runtime launch contract aligned with the learner flow instead of alphabetical artifact sorting.

## Addendum (2026-07-01 Interactive Blocks)

- Every published term now also ships two lightweight interactive surfaces:
  - `at-a-glance` as a compact visual table
  - `concept-map` as a lightweight diagram-style learning map
  - `quick-faq` as compact question-and-answer reinforcement
  - `quick-quiz` as a self-check block with answer reveal and explanation
- This is the first durable layer of quiz/infographic-style learning depth in the runtime corpus.
- It stays JSON-first and block-based, so richer visuals can still be added later for featured concepts without changing the core data model.

## Addendum (2026-07-01 Comparison View)

- The runtime corpus now includes a first-class `comparison` block for clearer term boundary learning.
- This block is meant to make “what it is vs what it is not” visible, which is especially useful for adjacent AI/ML concepts that learners often conflate.
- The comparison block is a better fit for infographic-style learning than long prose because it lets the app show contrasts, common confusion, and the next study move in one glance.

## Addendum (2026-07-01 Featured Deep Dive Tiers)

- The importer now assigns an editorial tier to each term so the corpus can stay honest about depth.
- `featured` terms receive an extra `deep-dive` block that turns the source graph into a stronger visual teaching surface.
- `standard` terms keep the compact launch stack.
- `sparse` terms still publish cleanly, but they stay visibly lighter instead of pretending to have the same editorial mass as the flagship concepts.
- These tier labels are current product controls, not your requirement to stop at those three shapes forever.
- This is a durable way to grow the corpus: enrich where the source and graph deserve it, and keep the rest concise.
- The path pages now reuse the same tiering to highlight which concepts in a trail deserve deep study, which keeps the curriculum itself aligned with the corpus structure.
- The explore/library page now reuses the same tiering for discovery, so users can enter through featured concepts before falling back to general search and broad shelves.
- The account page now exposes the same tiering as a membership signal, which helps the paid model explain why the corpus is worth protecting across devices and sessions.
- The saved shelf and notebook now reuse the same tiering as the corpus, which keeps private memory aligned with the editorial model instead of treating every saved concept as identical.
