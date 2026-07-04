# Design Direction Research

Date: 2026-06-29
Scope: landing-page and product-surface direction for a paid AI/ML/DL learning product

## Prompt Behind This Pass

Why should AIGlossary Pro exist visually as a consumer learning product instead of reading like an internal tool, documentation site, or generic SaaS shell?

## Research Lenses

1. Industry pattern
2. Content type pattern
3. Interactivity pattern
4. Monetization signal pattern
5. What should be avoided

## Official Sites Reviewed

Learning subscriptions:

- Brilliant: https://brilliant.org/
- MasterClass: https://www.masterclass.com/
- Coursera: https://www.coursera.org/

Knowledge and note products:

- Readwise: https://readwise.io/
- Milanote: https://milanote.com/
- Are.na: https://www.are.na/

## What Those Sites Actually Signal

### 1. Learning products sell transformation, not mere access

Brilliant leads with a strong tutor promise and emphasizes that sessions are visual and interactive, not memorization-first. It also makes the learning loop explicit: concepts click, guidance adapts, and the experience keeps learners moving. MasterClass leads with aspiration and immediately asks what the learner wants to become better at. Coursera leads with breadth, outcomes, recognizable partners, and clear category entry points.

Implication for AIGlossary Pro:

- the product should not open with "here is a glossary"
- it should open with "here is what this product turns you into"
- then immediately show how learning happens

### 2. Knowledge tools make the container itself memorable

Readwise sells a loop: import, review, remember. Milanote sells a visual workspace, not generic notes. Are.na sells a worldview about saving ideas, building paths, and being sustained by members rather than ads.

Implication for AIGlossary Pro:

- the notebook, saved terms, annotations, and paths are not secondary utilities
- they are part of the identity of the product
- the surface should feel like a private intellectual workspace, not like account settings around a glossary

### 3. Visual proof matters as much as copy

Every reviewed product uses strong preview surfaces:

- Brilliant shows the interactive tutor and subject coverage
- MasterClass uses rich instructor imagery and guided intent selection
- Coursera uses program cards, category rails, logos, and offer modules
- Readwise shows the product loop with images
- Milanote shows the board interface directly
- Are.na visually reinforces that it is a space for connected collections, not text-only storage

Implication for AIGlossary Pro:

- a text-heavy landing page is the wrong default
- the product should preview term cards, concept paths, notebook artifacts, saved collections, and content clusters
- the visitor should understand the learning interaction before reading a long paragraph

### 4. Paid products show conviction in what membership buys

Are.na is especially relevant here because it frames the product as member-supported and worth paying for. Coursera and Brilliant are also explicit about what the learner gets and why it is worth subscribing to.

Implication for AIGlossary Pro:

- the membership model should feel intentional, not apologetic
- "monthly or yearly" plus "lifetime" should read as a collector and serious-learner model
- pricing should feel like access to an evolving study system, not just a content paywall

## Addendum (2026-07-01 Landing Atlas)

- The home surface now includes a reusable corpus atlas card that turns the published manifest into a visual learning preview instead of a text-only summary.
- The atlas is intentionally infographic-like: it shows structure layers, path counts, coverage signals, and corpus scale in one consumer-facing card.
- This keeps the landing experience closer to Brilliant/Readwise-style proof surfaces and farther from admin-dashboard framing.

## Addendum (2026-07-01 Curriculum Blueprint)

- The home surface now also includes a reusable structure explorer card built from the published workbook registry.
- This surface shows launch-runtime, editorial-expansion, and backlog as visible product layers with real section examples, so the workbook shape reads like a curriculum map rather than an internal schema dump.
- That makes the structure sheet itself legible to learners and collaborators without collapsing it into a long text block.

## Addendum (2026-07-01 Study Memory)

- The home surface now exposes a reusable study-memory card that summarizes bookmarks, notes, shelves, and export action from the actual study state.
- This makes the product feel like a membership with memory instead of a static glossary, because the user can immediately see what they have saved and what they can carry forward.
- That also strengthens the premium value proposition: the corpus is the content, but the saved shelf and notebook are part of the paid experience.

## Addendum (2026-07-01 Continue Learning)

- The app now remembers the last opened term and surfaces it as a home-page resume action.
- This closes the loop between browse and return, so the learner can re-enter the corpus at the same point they left off instead of starting from search every time.
- The new continue-learning card works alongside the atlas, structure explorer, and study-memory card to make the home page feel like an active learning dashboard rather than a brochure.

## Addendum (2026-07-01 Recent Activity)

- The home surface now also summarizes recent study actions: last opened term, latest bookmark, and latest note.
- This gives the landing page a more human learning rhythm, because the user can immediately see the most recent learning state instead of only the static product state.
- Recent activity is a small but important membership signal: the product is not just content, it is continuity.

## Addendum (2026-07-01 Resume Path)

- The app now also remembers the last opened guided learning path and surfaces it as a resume action on the home page.
- This makes the path system feel like a real curriculum loop rather than a directory of clusters, which is closer to the intended premium learning experience.
- The resume-path card complements the concept resume card, so both term-level and trail-level continuation are visible in the same home surface.

## Addendum (2026-07-01 Shared Preview Handoff)

- Shared term links now include a clearer handoff from public preview to paid study packet.
- The preview remains open and lightweight, but it now explains that bookmarks, annotations, notes, and the downloadable term packet live on the canonical member page.
- This keeps sharing useful for discovery while preserving the paid experience for deep study workflows.

## Addendum (2026-07-01 Excerpt Annotations)

- Term annotations now support a selected excerpt field so learners can anchor their note to a specific passage.
- This makes annotations easier to revisit later and much more useful when exporting study packets or reviewing a dense concept page.
- The UX stays simple: notes still live on the same page, but the annotation now has the option to quote the exact text the learner wanted to remember.

## Addendum (2026-07-01 Path Export Packet)

- Learning trails now expose a JSON export packet from the path detail page.
- The packet captures the full path, its step ordering, and the current trail metadata so a learner can keep or share the structure outside the app.
- This keeps the path experience aligned with the project’s JSON-first rule and makes the curriculum layer feel more reusable for serious study.

## Addendum (2026-07-01 Unified Export Loop)

- The saved shelf and notebook pages now explicitly describe the full export loop across workspace exports, term packets, and path packets.
- This makes the study surfaces feel like one connected memory system instead of a set of unrelated export buttons.
- The export story now reads cleanly: the workspace captures the whole membership state, while terms and paths can be exported as focused JSON packets for reuse or sharing.

## Addendum (2026-07-01 Term Export Packet)

- The canonical term page now exposes an export action that downloads a term study packet with the current note, bookmark state, annotations, and source trace.
- This makes export feel like a learning workflow primitive instead of a hidden account feature, which better matches the premium membership promise.
- The term packet is intentionally per-term and JSON-shaped so it stays aligned with the project’s JSON-first content model.

## Addendum (2026-07-01 Content Depth Atlas)

- The home surface now includes a content-depth atlas that explains the difference between full corpus coverage and curated editorial depth.
- That visual makes the product feel more like a serious consumer learning brand because it shows what every term gets, what is selectively enriched, and where quizzes/diagrams belong.
- The key product rule is now explicit in the UI:
  - all terms get the compact launch runtime
  - high-value clusters get deeper prose, diagrams, and quiz treatment
  - the structure workbook stays a blueprint, not a runtime mirror
- This is a better fit than a full text-only explanation because the user can see the product model at a glance.
- The home hero and pricing surface now also reinforce that there are featured, standard, and sparse tiers, so first impressions point at the editorial strategy instead of hiding it in the term pages.

## Addendum (2026-07-02 Learning Lens Rail)

- The home surface now also includes a visual lens rail that explains the product through three consumer-facing frames:
  - industry lens
  - content-type lens
  - interactivity lens
- This keeps the homepage from reading like a generic internal tool dashboard, because it shows the product’s point of view before asking the visitor to read long copy.
- The lens rail is meant to reinforce the app as a premium study brand: concise, visual, and clearly centered on learning behavior rather than admin surfaces.

## Design Conclusions By Lens

### By industry: consumer learning

Use:

- transformation-led hero
- visible category entry points
- proof of curriculum depth
- credibility markers
- obvious next action

Avoid:

- admin/dashboard composition
- settings-first navigation
- feature checklist as the main story

### By content type: reference plus study system

Use:

- term previews with taxonomy context
- cluster views and concept shelves
- editorial featured collections
- notes/highlights/bookmarks as visible artifacts
- a "field guide" or "private library" metaphor

Avoid:

- pure article/blog layout
- pure docs layout
- search-only interface with no editorial guidance

### By interactivity: knowledge retention, not passive reading

Use:

- visible save/highlight/note flows
- concept-to-concept movement
- study paths or trails
- collection building
- export/share proof

Avoid:

- static text slabs that hide the interactive loop
- making the notebook feel like a buried utility page

## Why The Earlier Text-Led Landing Was Wrong

It failed on three levels:

1. It described the product more than it demonstrated it.
2. It made the page feel like a polished internal concept note instead of a product people want to join.
3. It hid the most differentiated part of the product: structured learning behavior around terms.

Text is still important, but it should support strong visual and interaction cues rather than carry the full landing page by itself.

## Non-Negotiables For AIGlossary Pro

1. The landing page must preview the product, not summarize it.
2. The notebook and saved-study layer must appear on the marketing surface.
3. Taxonomy should be visible spatially, not only explained verbally.
4. The product should look paid, intentional, and calm, not ad-driven or growth-hacked.
5. It must feel like a B2C learning brand, not an operator dashboard.

## Recommended Surface Strategy

### Landing page

Should include:

- a strong transformation-led hero
- a visual preview of a featured term cluster
- category or shelf navigation
- visible study artifacts such as saved cards, note snippets, and collections
- a membership block that sells the value of the system

Should not rely on:

- long explanatory paragraphs
- architecture language
- feature grids as the main event

### Library page

Should feel like:

- a browsable catalog
- taxonomy-forward
- editorially guided, not only search-driven

### Term page

Should feel like:

- reference plus study workspace
- concise top explanation, then deepening blocks
- strong related-term movement
- visible save, note, annotate, and export actions

### Saved and notes pages

Should feel like:

- a private study room
- not a generic table of records

## Recommended Next UI Moves

1. Add a visual concept-map or path-preview component to the landing page.
2. Add notebook artifacts to the landing page so visitors see personal study accumulation.
3. Rework Library so it has featured shelves, not just search and results.
4. Rework term pages around "learn / connect / save / continue" instead of document blocks alone.
5. Make Saved and Notes feel editorial and collectible, not utility-first.

## Decision

Chosen direction:

- editorial consumer learning brand with a private-library / field-guide mental model

Rejected directions:

- internal-tool shell with consumer copy pasted on top
- docs-site minimalism as the primary product language
- generic SaaS card dashboard

## Source Notes

Brilliant:

- emphasizes visual and interactive learning and adaptive guidance
- source: https://brilliant.org/

MasterClass:

- emphasizes aspiration, intent selection, and rich visual category entry
- source: https://www.masterclass.com/

Coursera:

- emphasizes goals, recognizable partners, category breadth, and offer clarity
- source: https://www.coursera.org/

Readwise:

- emphasizes the loop of import, review, and remember
- source: https://readwise.io/

Milanote:

- emphasizes visual organization and seeing the big picture with the details
- source: https://milanote.com/

Are.na:

- emphasizes connected knowledge collecting, paid membership, and a worldview around curiosity
- source: https://www.are.na/

## Addendum (2026-06-30)

The public landing page direction is now reflected in the app shell:

- the home page shows a featured field-guide panel, notebook-style artifact cards, and concept-path previews
- this is meant to prevent the surface from collapsing into a text-heavy internal-tool look
- the same visual strategy should be reused in future marketing surfaces and onboarding screens

Keep using the consumer learning brand / private-library / field-guide mental model for any new public-facing route.

## Addendum (2026-07-01 Next Concept Recommendation)

- The home continue-learning card now suggests a next concept based on the current term graph or the corpus trail.
- This keeps the learning surface active rather than purely historical, which is closer to how a serious learner expects guidance to work.
- The recommendation remains lightweight and deterministic, so it stays aligned with the JSON-first corpus instead of adding a separate AI-driven layer too early.
