# Content Architecture Map

Date: 2026-07-01
Purpose: classify the structure workbook into runtime, editorial, and backlog layers so the app stays JSON-first, scalable, and consumer-facing

## Source Evidence

- glossary workbook: `data_glossary.xlsx` tab `main`
- structure workbook: `data_structure.xlsx` tab `Sheet2`
- current published corpus: `public/content/published`
- current importer: `tools/build_published_content.py`

## Structure Workbook Shape

- header fields on `Sheet2` row 2: `295`
- top-level sections: `43`
- the workbook is a blueprint, not a direct runtime payload

## What The Structure Is For

The structure sheet describes the editorial ceiling of the product:

- what a term can explain
- what a learner can compare
- what can be drilled, visualized, or expanded later
- what should remain optional until the term justifies deeper treatment

It is not the right shape for the published JSON payload itself.

## Launch Runtime Layer

These are the sections that should remain visible in the canonical term JSON and on the term page at launch:

- `Introduction`
- `Prerequisites`
- `Theoretical Concepts`
- `How It Works`
- `Variants or Extensions`
- `Applications`
- `Implementation`
- `Evaluation and Metrics`
- `Advantages and Disadvantages`
- `Ethics and Responsible AI`
- `Related Concepts`

Why:

- these sections cover the core learning arc
- they support the paid study loop directly
- they can be rendered compositionally from a compact block registry
- they are enough to make the product feel like a serious learning surface without needing the whole 295-field sheet at runtime

## Editorial Expansion Layer

These sections are good candidates for richer generation, featured collections, or selected term expansion:

- `Historical Context`
- `Case Studies`
- `Hands-on Tutorials`
- `Industry Insights`
- `Common Challenges and Pitfalls`
- `Real-world Datasets and Benchmarks`
- `Tools and Frameworks`
- `Further Reading`
- `Research Papers`
- `Career Guidance`
- `Future Directions`
- `Glossary`
- `FAQs`
- `Tags and Keywords`
- `References`
- `Conclusion`
- `Best Practices`
- `Security Considerations`
- `Optimization Techniques`
- `Comparison with Alternatives`
- `Illustration or Diagram`

Why:

- these are valuable, but not all of them need to appear for every term on day one
- some are stronger as curated or conditional blocks
- some are better for premium/featured topic clusters
- some are better as later editorial growth than as default runtime obligations

## Long-Tail Backlog Layer

These sections are useful as optional enrichments or future tooling inputs:

- `Interactive Elements`
- `Quick Quiz`
- `Did You Know?`
- `Project Suggestions`
- `Recommended Websites and Courses`
- `Collaboration and Community`
- `Metadata`

Why:

- they can add a lot of perceived depth
- they also risk turning the app into a bloated CMS if forced into every term too early
- they are better treated as growth paths for selected terms, not mandatory schema weight for the entire corpus

## Current Canonical Runtime Shape

The current builder intentionally keeps runtime terms compact:

- summary
- taxonomy
- graph links
- ordered term blocks
- source trace
- study-family inference

The current generated blocks are:

1. `overview`
2. `taxonomy`
3. `connections`
4. `study-prompts`
5. `why-it-matters`
6. `comparison-notes`
7. `recall-drill`
8. `source-definition` when available

This is the right shape for now because it gives every term a usable learning surface without copying the entire structure workbook into runtime JSON.

The build now also emits `editorial/launch-contract.json` so the launch subset is explicit at the artifact level, not only in this map.

## Decision

Use the structure sheet as the editorial blueprint, not as the direct runtime contract.

Chosen path:

- keep JSON runtime compact
- generate richer blocks from the structure only where they add real learner value
- preserve the rest as editorial growth inventory

Rejected path:

- publishing a 295-field monster schema for every term
- making the structure sheet the direct app payload
- duplicating content into a second CMS-like content system

## Next Implementation Questions

1. Which editorial sections should be auto-generated for every term, and which should remain conditional?
2. Which sections should only appear on featured paths or premium-highlighted concepts?
3. Which structure fields should be reduced to derived metadata rather than visible blocks?
4. Which sections should be converted into reusable widgets instead of static prose?

## Outcome

The structure is now explicitly mapped to product layers so we can keep building the app as a durable learning product, not as a spreadsheet mirror.

## Addendum (2026-07-01, content depth policy)

- The published corpus now needs to read as a layered learning system in the UI, not just in docs.
- Every term keeps the compact launch runtime blocks, but richer editorial treatment should be concentrated into featured clusters, path headers, and high-confusion concepts.
- The right visual hierarchy is:
  - universal runtime blocks for every term
  - selective editorial depth for the long tail where source material supports it
  - infographic, diagram, and quiz-heavy treatment for flagship learning surfaces
- This avoids two failure modes:
  - flattening the whole corpus into shallow uniformity
  - turning the runtime into a giant CMS-style schema mirror
- The home surface should visibly explain that balance so the product feels honest, intentional, and premium.

## Addendum (2026-07-01, editorial depth tiers)

- The importer now assigns each term an editorial tier:
  - `featured` for concepts that deserve a stronger visual deep dive
  - `standard` for the normal launch stack
  - `sparse` for entries that are still intentionally lightweight
- Featured terms get an additional deep-dive block that is more infographic-like and more explicit about context, comparisons, and the study move.
- This is the right compromise between “every term is beautiful” and “the whole corpus gets bloated.” The long tail stays compact, while the best learning nodes become visibly richer.
- Learning paths now surface the featured deep-dive terms directly, so the curriculum itself explains why a trail is worth following and where the richer study treatment lives.
- The explore/library page now does the same thing for discovery: featured concepts appear as a visible entry rail before search, which makes the app feel curated and helps new learners start with stronger anchors.
- The account page now acts as a membership proof surface: it shows the corpus depth that membership protects, alongside the two-plan logic and the continuity promise.
- The saved shelf and notebook now reuse the editorial tier breakdown too, so private study state can show how much of the learner's memory is anchored in featured deep dives versus standard and sparse terms.

## Addendum (2026-07-01 Consumer-facing interactive layer)

- The home surface now explains the learning system as a set of visible learner moves instead of a build report:
  - at-a-glance orientation
  - concept maps
  - quick FAQs
  - quick quizzes
  - featured deep dives
- The runtime corpus also now includes a dedicated comparison view so adjacent terms can show “what it is,” “what it is not,” and “common confusion” in one glance.
- This keeps the product honest about structure while making the first impression feel like a premium learning app rather than a backend dashboard.

## Addendum (2026-07-01 Flagship Family Authoring)

- The content generator now carries family-specific authoring cues for the highest-value concept families.
- That lets the corpus keep a single JSON contract while still teaching Neural Networks, NLP, Computer Vision, RL, Statistics, Evaluation, Ethics & Governance, and Similarity/Deduplication in distinct ways.
- The intended product effect is that flagship clusters feel purpose-built and memorable, while the long tail stays compact and honest.

## Addendum (2026-07-01 Flagship family discovery rail)

- The home surface now introduces the flagship concept families directly, so the product feels curated from the first screen.
- This gives learners an obvious entry point into the richer authored clusters instead of making them infer the important families from the term search alone.

## Addendum (2026-07-01 Families route)

- The app now has a dedicated `/families` route that groups the deepest concept clusters into a curated study entry point.
- This route is intentionally distinct from the full library search so learners can choose a study lane before they choose a specific term.

## Addendum (2026-07-01 Product Boundary Clarification)

- The editorial categories `featured`, `standard`, and `sparse` are the product's curriculum controls, not a requirement from you for every term.
- The 295 structure columns are a planning schema, used as a growth source and generation input, not as the direct runtime contract for all terms.
- These boundaries are product decisions made during implementation to keep the corpus scalable and honest; they should not be read as your instruction to cap the corpus at those tiers forever.
- If the product later makes more of the 295 fields universal, that should be treated as an expansion of the generator and runtime model, not as a contradiction of your original intent.
- Long-tail coverage is intentionally honest:
  - all terms get compact launch blocks,
  - selected concepts receive richer treatment (deep dives, visuals, quizzes, comparisons),
  - selected families remain the first-order premium learning anchors.
- What this means operationally: we do not force one-size-fits-all field parity across 18k+ concepts; we optimize depth where it creates learner value.

## Addendum (2026-07-01 Family detail lanes)

- Each flagship family can now open into its own detail lane with featured terms, broader family terms, and related paths.
- This is the right shape for a learning product because it lets the app teach a family as a concept ecosystem rather than only as a list of search hits.

## Addendum (2026-07-01 Family study trail)

- Family detail lanes now include a tiny study trail that nudges the learner from deep dive to comparison to path to export.
- This trail makes the family page a real work surface for learning instead of only a browsing surface.

## Addendum (2026-07-02 Anchored term study flow)

- Term pages now expose direct anchors into the published block stack, so learners can jump straight to the at-a-glance table, concept map, FAQ, comparison view, quiz, featured deep dive, or source snippet.
- This makes the study page feel less like a long scroll of content blocks and more like an interactive learning desk with visible moves.
- The anchor rail uses the same generated JSON blocks the runtime already publishes, so the interaction stays content-driven instead of becoming a separate UI-only shortcut system.

## Addendum (2026-07-02 Term curriculum map)

- Term pages now also surface a visible curriculum map that lays out the full learning arc:
  - introduction
  - prerequisites
  - theoretical concepts
  - how it works
  - variants or extensions
  - applications
  - implementation
  - evaluation and metrics
  - advantages and disadvantages
  - ethics and responsible AI
  - related concepts
- This makes the structure workbook legible on the term page itself, so the product feels like a learning system with an explicit curriculum rather than a set of disconnected content blocks.

## Addendum (2026-07-02 Path content mix)

- Learning trail pages now surface their interactive content mix directly in the path hero.
- The learner can see how many quizzes, diagrams, FAQs, comparisons, and deep dives are present in the featured terms before opening the trail.
- This makes the path surface feel like a real study guide, because the user can judge both the topic progression and the kind of reinforcement available inside it.

## Addendum (2026-07-02 Workspace content mix)

- The saved shelf, notebook, and study-memory surfaces now also summarize the interactive content mix behind the user’s saved terms and notes.
- That means the paid workspace can say not just how many items are saved, but how much quiz, diagram, FAQ, comparison, and deep-dive depth is already present in the learner’s personal corpus.
- This helps the workspace feel like a living study system rather than a plain list of bookmarks and text notes.

## Addendum (2026-07-02 Family lane content mix)

- Flagship family lanes now surface their interactive content mix as well.
- That gives each family page a direct premium signal: the learner can see how much quiz, diagram, FAQ, comparison, and deep-dive depth exists inside that family before they open the term pages.
- This makes the family lane function as a true curated study hub instead of just a grouping of terms.

## Addendum (2026-07-02 Published curriculum-map block)

- Every published term now carries a `curriculum-map` block in the JSON runtime.
- The block is derived from the launch contract, so the workbook structure is now represented as first-class content rather than only as a UI helper or doc note.
- This is the right next step toward fuller structure coverage because it makes the curriculum shape visible in the same artifacts that power bookmarks, notes, sharing, and exports.

## Addendum (2026-07-02 Featured structure-expansion block)

- Featured terms now also publish a `structure-expansion` block derived from the editorial and backlog structure sections.
- This is the first runtime surface that visibly promotes beyond the launch contract into the broader workbook ceiling, while still keeping the content model JSON-first and selective.
- The block is intentionally limited to featured terms so the corpus stays readable and the richer workbook layers stay earned rather than sprayed across every entry.
