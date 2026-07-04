# AIGlossary v2 Expansion Map

Date: 2026-06-30
Purpose: keep the fresh product on a long-term path without recreating the old project's complexity

## What We Are Building

A paid-only AI/ML/DL learning app that feels like a consumer study product:

- not a docs site
- not an internal tool
- not a generic SaaS dashboard
- not a freemium lead funnel

The durable shape is:

- JSON-first content layer
- Cloudflare-native runtime
- D1 for user state
- Dodo for billing
- external auth for launch
- bookmark / note / annotate / share / export as the retention loop

## Expansion Axes

### 1. By Industry Pattern

The product should borrow from consumer learning brands, not admin software.

Reference signals:

- learning subscriptions should sell transformation
- knowledge tools should make the container memorable
- preview surfaces should show the interaction, not just explain it

Implication:

- the homepage should be visual and product-first
- the pricing page should feel like membership in a serious study system
- the app shell should look like a private library, not an ops console

### 2. By Content Type

The corpus should be published as layered learning content:

- term identity
- short summary
- block-based explainer content
- taxonomy
- links to prerequisites, related ideas, and next topics
- personal notes and annotations

Implication:

- the runtime should stay JSON-first
- the structure sheet should become a bounded block registry, not a 689-column mirror
- content growth should happen by adding better blocks, not by bloating the core schema

### 3. By Interactivity

The durable interaction loop is:

1. discover a term
2. save it
3. annotate it
4. share it
5. export it
6. revisit it later

Implication:

- bookmarks are not a sidebar toy; they are a retention primitive
- notes and annotations are not a utility feature; they are the learning workspace
- exports should feel like study packs, not raw data dumps

### 4. By Monetization

Commercial structure stays intentionally small:

- monthly/yearly subscription
- lifetime purchase

No free tier.

Implication:

- the product needs enough public surface for trust and SEO
- but the valuable layer stays gated
- membership should feel like access to an evolving field guide, not a content paywall

## What To Add Next

### Product surfaces

- stronger landing-page proof of concept
- featured concept clusters
- notebook artifact previews
- membership explanation that shows why paying is worth it
- term page blocks that visibly support learning progression
- pricing page as a visual membership pitch, not a plain plan sheet

### Content surfaces

- richer summaries for high-value terms
- better taxonomy depth and dedupe handling
- editorial block mappings from the structure sheet
- better prerequisite/related/next graph quality

### Retention surfaces

- saved collections
- export history
- annotation anchors by block
- shareable public term previews
- account page as continuity proof, not an account settings dump

## What To Avoid

- creating a second content system next to the JSON corpus
- building an overly flexible CMS too early
- using the structure sheet as a direct runtime payload
- allowing fallback copy to sound like prototype text
- adding workflow complexity that does not improve learning

## Decision Log

### Decision 1

Use JSON as the canonical runtime content layer.

Why:

- portable
- cacheable
- diffable
- easy to rebuild

### Decision 2

Use Cloudflare for launch.

Why:

- the app is read-heavy
- content is CDN-friendly
- user-state needs are small relative to corpus size
- ops simplicity matters more than backend generality

### Decision 3

Keep auth external at launch.

Why:

- auth is not the moat
- account recovery matters
- the real product work is content and study workflow

### Decision 4

Keep billing to Dodo with exactly two paid plans.

Why:

- simpler commercial model
- easier entitlement logic
- better supportability

## Open Questions

1. Which content blocks should be considered required for every term at launch?
2. Which share/export formats are mandatory on day one?
3. How much of the structure sheet should be exposed as visible learner blocks versus hidden metadata?
4. Do we want concept-path pages to be editorially curated or mostly algorithmic at launch?

## Next Concrete Step

Turn this map into the implementation backlog for:

- landing page redesign
- term page block system
- saved workspace UX
- content-import scoring improvements

## Addendum (2026-06-30, old-project recovery pass)

I reviewed the older `AIMLGlossary/AIGlossaryPro` project notes to extract durable product lessons without reusing the old stack.

What seems worth keeping:

- strong public glossary surfaces as acquisition and trust assets
- term-page interaction audits as a useful quality habit
- visual proof of learning flows before claiming product polish
- learning paths as a real product surface, not an afterthought

What clearly should not be repeated:

- multiple deployment tracks for the same product
- mixed backend/runtime choices spread across EC2, ECS, S3, CloudFront, Firebase, Redis, and other stacks
- auth and billing surfaces that drift away from the main app runtime
- content systems that become too configurable before the consumer learning loop is stable

The concrete direction this reinforces for v2:

- keep one canonical Cloudflare runtime
- keep JSON content as the portable source of truth
- keep D1 for user state only
- keep the product visually consumer-first, not ops-first
- keep the feature set intentionally narrow until the learner loop is clearly strong

## Addendum (2026-06-30, browse and study surface refinement)

- The library page now opens with 3 browse lenses and a curated 12-card slice of the catalog instead of dumping the full term index immediately.
- The term page now shows the study loop explicitly: read, bookmark, annotate, share/export.
- This is the right product pattern for a consumer learning app because the user should feel guided into the corpus, not confronted with an endless registry.
- Search still exists as the path to the full index, so the browse surface stays welcoming while the power surface remains available.

## Addendum (2026-06-30, notebook and saved memory refinement)

- The notebook page now behaves like a private study ledger: preview cards, excerpts, and note size cues help the user revisit what matters.
- The saved page now behaves like a shelf plus export room: saved categories are visible, and export history is treated as a durable study artifact.
- This keeps the workspace feeling like a learner’s personal system instead of an admin area.

## Addendum (2026-06-30, corpus and production truth update)

- The corpus is now treated as a real published artifact set, not a sample-in-app placeholder.
- The importer/build path from workbook inputs into `public/content/published` is the canonical content surface.
- The auth, Dodo billing, and D1 study-sync layers are implemented as canonical Worker-backed product paths; what remains is environment provisioning for the live deployment.
- This is the product boundary to protect going forward: content stays JSON-first and generated, user state stays D1-backed, and the public UI should never regress into sample-data language.

## Addendum (2026-06-30, family-first browse surface)

- Explore now surfaces broad study families from the published corpus, including inferred families for terms that do not yet have source taxonomy coverage.
- This is important because it gives the large unclassified majority a real browse entry point instead of forcing everything through exact search.
- The family labels are intentionally coarse and should be treated as browse anchors, not authoritative subject taxonomy.

## Addendum (2026-06-30, corpus accuracy audit)

- A dedicated content-audit report is now part of the published-content build so accuracy is rechecked every time the corpus is regenerated.
- This matters for the expansion map because it turns term accuracy, block order, source traceability, and link safety into measurable corpus health signals instead of hand-wavy editorial intent.

## Addendum (2026-07-01, old-project recovery pass)

- The older `AIMLGlossary/AIGlossaryPro` docs reinforce the same product direction from a different angle:
  - keep public browsing, search, paths, saved items, notes, and export as the core learner loop
  - keep visual proof and browser QA as a quality habit
  - keep premium gating tied to visible value in the study flow
- They also show the complexity traps that should stay out of v2:
  - multi-stack deployment sprawl
  - an over-wide runtime schema that mirrors the full editorial blueprint
  - auth and billing surfaces drifting away from the main app runtime
  - feature sprawl before the shell feels coherent
- This reinforces the current v2 guardrails:
  - one Cloudflare-native runtime
  - JSON content as the single content surface
  - D1 only for mutable user state
  - Dodo for exactly two paid plans
  - consumer-first product language on every public/member-facing screen
- The remaining unclassified majority should now be treated as a browse-and-audit backlog, not a sign that the published corpus is a sample or a prototype.

## Addendum (2026-06-30, paid study loop surfaces)

- The saved workspace now reads as a member shelf plus export room instead of a utility list, with shelf summaries, latest export state, and membership messaging surfaced together.
- The notebook page now emphasizes note depth, strongest note recall, and export as part of one study loop rather than presenting notes as isolated annotations.
- This is important because the monetizable value is not only access to terms; it is the recurring study workflow that helps the learner keep state, revisit ideas, and carry the workspace across sessions.
- The next expansion step should keep pulling pricing, account, saved, notes, share, and export surfaces into a single mental model instead of letting them drift into separate product fragments.

## Addendum (2026-07-01, long-tail editorial depth)

- The importer now emits richer generated editorial blocks for every term: `Why It Matters`, `Comparison Notes`, and `Recall Drill`.
- This gives the long tail more useful study depth without creating a second CMS or inventing a separate content pipeline.
- The directional takeaway is that depth should grow from the workbook-derived graph and taxonomy, not from parallel manual content systems that would be harder to scale and keep honest.

## Addendum (2026-07-01, content expansion roadmap)

The next editorial pass should prioritize content by tier and by learning leverage, not by raw sheet order.

### 1. Featured tier

These terms already have enough source and graph signal to justify a deeper study treatment:

- add more context-rich examples
- expand comparison notes into stronger “what it is / what it is not” framing
- consider richer diagrams or infographic-style overlays on the most important cluster pages
- keep these terms as the public examples of what premium depth looks like

Best candidates for this treatment:

- foundational neural network concepts
- transformer and attention terms
- core optimization and loss-function terms
- evaluation and metric concepts
- high-signal computer vision and NLP anchors

### 2. Standard tier

These terms should keep the compact launch stack but can still improve through:

- sharper summaries
- better prerequisite and next-step graph edges
- cleaner taxonomy labels
- improved source traceability

This is the main corpus workstream because it preserves scale while raising quality across most of the library.

### 3. Sparse tier

These terms should stay honest and lightweight until more signal exists.

The goal is not to force them into fake depth. The right treatment is:

- keep them browsable
- avoid overclaiming
- let the graph and structure map surface them as needed
- deepen them later only when source quality or learner demand justifies it

### 4. Featured interaction surfaces

The richest interactive treatment should be concentrated on:

- path pages
- featured term pages
- shared previews that convert into the canonical term page
- member workspace summaries for saved and notebook items

This keeps the product feeling premium where it matters while preventing the whole corpus from turning into a bloated editorial CMS.

### 5. Expansion order

Recommended next editorial order:

1. strengthen featured cluster pages
2. raise standard-tier summaries and graph links
3. enrich the strongest shared preview concepts
4. keep sparse entries honest and searchable

This order keeps the learning system coherent, scalable, and visibly better without diluting the structure sheet or the JSON runtime.

## Addendum (2026-07-01, shared preview tier cue)

- Shared term previews now hint at the term's editorial tier so a public link can act as a teaser for the richer canonical experience.
- Featured terms should imply a deeper member-only study experience without exposing private notebook behavior.
- This keeps sharing aligned with the rest of the product:
  - public preview for discovery
  - canonical term page for the full study workflow
  - member workspace for notes, bookmarks, annotations, and exports

## Addendum (2026-07-01, term-page tier cue)

- The canonical term page now shows the editorial tier directly in the hero so the learner can tell whether the concept is a featured deep dive, a standard launch entry, or a sparse long-tail term.
- This keeps the study page honest about content depth and reinforces the product rule that richer depth should be visible where it matters most.

## Addendum (2026-07-02, family-lane navigation pass)

- Term pages now expose linked prerequisites, related concepts, next steps, and family-lane previous/next controls instead of leaving those relationships as plain text.
- The explore shelves now click through to term pages and also point back to the family rail, which makes the library feel like a consumer learning product rather than a static index.
- This is the right next layer because it increases study continuity without inventing a second navigation system or diluting the JSON-first corpus shape.

## Addendum (2026-07-02, old-project recovery pass)

- I reviewed the older `AIMLGlossary/AIGlossaryPro` recovery docs and deployment notes to mine reusable product signals.
- Reusable signals:
  - public glossary browsing as acquisition and trust
  - search plus cross-references as the core discovery loop
  - learning paths as explicit curriculum surfaces
  - saved items, notes, annotations, and exports as retention primitives
  - visual proof and browser QA before launch claims
- Anti-patterns to avoid:
  - many overlapping processing versions for the same task
  - direct 295-column runtime thinking
  - multiple deployment/runtime tracks
  - utility-shell framing that reads like an internal tool
  - billing/auth drifting away from the main study experience
- The v2 product should keep the good signals and leave the old stack’s complexity where it belongs: as a lesson, not a blueprint.
