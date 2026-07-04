# AIGlossary v2 — Design & Concept Audit (Read-Only)

Date: 2026-07-04
Confidence: 0.74 (inferential — no live user research, but I have a full visual + code baseline)
Status: opinions + concrete redesign plan, not yet executed

## 1. What this product is, in one sentence

AIGlossary v2 is a paid, single-tenant AI learning surface for serious
learners. It is not a dictionary. The thesis is that the moat comes from
"breadth of corpus × structured taxonomy × cross-links × personal study
memory" — and the design has to make all four of those legible without
feeling like a SaaS dashboard.

## 2. What's actually working

- The color and material language is unusually coherent for a project this
  size. Cream + ink + burnt orange + steel blue. Consistent radii (~22-28px).
  Subtle vertical gradients. It does NOT look like another dark-mode AI SaaS
  template, which is genuinely rare and worth protecting.
- The taxonomy chrome is real: tier chips (FEATURED/STANDARD/SPARSE),
  category paths, prerequisites/related/next. That taxonomy chrome is the
  product moat and the design is making it visible.
- The home page hero concept ("AI field guide you grow into") is a sharp
  positioning line. "Field guide" is a deliberate metaphor that points away
  from "AI SaaS" and toward "private reference library."
- The term page is doing a lot of the right things: aliases, intro,
  definitions, why-it-matters, related terms, prerequisites, comparisons,
  deep dive, FAQ, quiz. That structural depth is the differentiator.
- The Field Lab page is a genuinely good idea: it surfaces the corpus,
  routes, blocks, and study memory as inspectable surfaces instead of
  hiding the architecture under marketing copy.

## 3. What's actively hurting the product (visually + conceptually)

### 3.1 The home page is structurally confused

The home page is currently ~12 stacked sections of "look at all the things
the app does." That is a roadmap page, not a home page. A serious learner's
home should answer "what do I do *right now* to learn?" not "here is every
feature."

Specific symptoms visible in `desktop-home.png`:

- Hero on the left, then a 5-card right column (Field Guide, Learning
  Atlas, Structure Explorer, artifact strip, concept paths, curriculum
  grid) that has no internal hierarchy. It reads as a sidebar of stuff
  rather than a designed composition.
- The "concept path preview" cards in dark navy are repeated three times
  with the same template (eyebrow + h3 + p + 2 chips + text link). That's
  exactly the AI-slop repetition the design rules call out.
- The "Format" section ("Read / Follow / Save / Review") and the
  "Learning Lenses" section are saying the same thing twice.
- The "Flagship Families" section, the "Launch Curriculum Preview," the
  "Continue Learning," the "Continue Path," the "Recent Activity," the
  "Study Memory," the "Corpus Progress," and the "Rituals" sections are
  all roughly the same thing: a card grid promoting corpus content. The
  page has at least six near-duplicate card grids. That is the single
  biggest visual problem with the product.
- The "Rituals" section uses top-stripe borders on cards
  (`.ritual-card { border-top: 3px solid rgba(255, 107, 61, 0.7); }`)
  which is the exact pattern the design rules ban as the #1 AI tell.

### 3.2 The term page is overwhelming without being deep

`desktop-term-transformer.png` is the entire Transformer term page
top-to-bottom in one column. It is essentially:

- Hero header
- Tier rail + chips
- "Most Similar" / "What" / "Compare" / "Deep Dive" comparison cards
- Three large dark "Read the term like an essay" cards
- Subject + concept block
- Definition
- Connection map
- Curriculum map
- Taxonomy, source, freshness, share
- Facets table
- Practice (composes a fully redundant "comparison")
- Runtime blocks (a 12-cell grid of repeated pattern)
- Comparison expansion
- Study prompts
- Concept map
- Context
- Connections
- Comparison
- Linkages
- Connections
- Application areas
- Frequently asked
- Quiz
- Quick check

This is roughly 18 visible sections. Even with the existing typography,
the eye stops scanning by the 6th section. The page is doing the work
of "we have a rich content model" but losing the work of "I came here to
read what Transformer is."

The repeated `.connection-link / .concept-link` pill grid is a
particularly bad pattern: the same tiny pill repeated ~40 times, four
columns wide, on the same warm background. It looks like a search
results page accidentally rendered into the term page.

### 3.3 The Field Lab is the most interesting page and it's getting hurt

The Field Lab is the page that should be the most architecturally
distinctive. Currently it has:

- A hero with three dark cards
- "Field guide field map" — a 4-card column grid of identical pattern
- "Field guide educational territory" — another card grid
- "Field guide field learning workflows" — another card grid
- A massive "Runtime blocks" 12-cell grid all using the same template
- A bar chart
- Three dark "Term grids" of identical structure
- 1,000-entry fake "8 published terms, 17,000 published fields" stat
  block that repeats the same big-number/small-label pattern 9 times
  (this is the exact "hero metric layout template" the design rules
  call out as banned)
- A "Routes" grid of identical 4-column cards
- Another "Components" grid
- A "Contracts" grid
- A "Block taxonomy" grid

This is the same problem as the home page: a single structural pattern
(card grid) repeated 10+ times with different content. It looks like a
component library demo, not a workspace.

### 3.4 The Explore page is the most legible, but still a wall of cards

`desktop-explore.png` actually has a clear vertical rhythm: featured
terms → unclassified families → search → matching entries. The featured
term cards are clean. The family cards are good. The matching entries
section is too tall, but it is at least a real, useful list. This page
should be the model for the rest of the redesign.

### 3.5 The pricing page is the closest to right

`desktop-pricing.png` has a clear hero ("One product. Two ways in."),
a "What membership buys" panel, a clear "Who this is for" panel, a
"Launch curriculum" panel, and then plan cards. This is the strongest
page. The plan cards at the bottom are slightly too text-heavy, but
the overall composition is the one to learn from.

### 3.6 Visual specific issues (the small things that add up)

- The hero card uses a `writing-mode: vertical-rl` orange spine that
  looks like a 1990s magazine pull-quote. It is not bad, but it is
  tonally inconsistent with the rest of the design — every other card
  is a soft warm rectangle.
- The `border-top: 3px solid` on `.ritual-card` is the AI slop tell
  the design rules ban outright.
- Every page uses the same `eyebrow` (uppercase, orange) on every
  section. After 4 sections on a page the eyebrow stops signaling
  anything and becomes visual noise.
- The nav has 9 items (Discover, Field Lab, Library, Families, Paths,
  Pricing, Saved, Notebook, Profile) crammed into a sticky pill on
  desktop. It is functional but it does not communicate hierarchy.
- The font stack is "Iowan Old Style" (serif) for body, "Avenir Next
  Condensed" (sans) for display, "Geist Variable" loaded but only
  used at the very end as the Tailwind font. That means body is serif
  but lots of supporting chrome (chips, pills, eyebrows) is sans, and
  the visual rhythm gets muddy. The font choice itself is good; the
  pairing just needs to be committed to.
- The brand mark is a flat orange square with "AG" inside. It does
  not look like the rest of the product. It is fine as a placeholder
  but it should be drawn to match the typography-led editorial
  language the rest of the design is reaching for.
- The mobile home page is basically a vertical soup. Every section
  stacks, every card becomes full-width, and the orange "Inspect the
  Whole App" button dominates the first screen because it is the only
  primary action. There is no mobile-specific composition.

## 4. The conceptual gap

The product thesis is "glossary + concept map + study system." The
design is currently presenting all three at equal weight on the home
page, which means none of them feel like the *point*. The right
structural move is to commit to a single opinion: the term page is
the product, the path page is the on-ramp, and the home page is the
*return* surface (continue, recent, study memory).

That means:

- Home page becomes: continue learning → 1-2 active paths → recent
  bookmarks → recent notes → corpus snapshot. Nothing else.
- Term page becomes: definition → why it matters → where it fits →
  comparisons → related terms → your note. The 12 supporting sections
  collapse into 4, and the others move to dedicated surfaces
  (Compare, Quiz, Diagram, FAQ all become a `/term/.../extras` route
  or a tab strip on the term page).
- Path page becomes the *primary* on-ramp for new users. Currently
  Paths is a peer of Explore, but the design should be saying
  "start with a path, not with a search."
- Field Lab becomes the *operator/editorial* surface and the design
  should embrace that. The current Field Lab is trying to be both
  marketing and a developer console. Commit to "internal truth
  surface" — make it feel like a working tool, not a slide.

## 5. Concrete redesign moves I want to make

These are scoped, opinionated, and verifiable. Each one ties to a
specific page and a specific file.

### Move 1: Rebuild the home page around "return to study"

- Drop "Flagship Families," "Learning Lenses," "Browse by mode,"
  "Rituals," "Continue Learning," "Continue Path," "Recent Activity,"
  "Study Memory," "Corpus Progress" as separate sections.
- Replace with: (1) a 3-card continue row (path / term / note), (2) a
  one-screen atlas showing the user's current term and the 4 nearest
  concepts, (3) a single "this week" strip, (4) a single quiet
  editorial strip ("Inside the library") that uses 3 term cards max.
- Fix the right-side hero column: remove the 5-card stack. Replace
  with a single composed "Field Guide" spread (page 1 of the field
  guide) that has a real layout — header, lead, byline, drop cap,
  3 columns of body — to make the "field guide" metaphor literal.
- Remove the `border-top` stripe on ritual cards. Replace with
  numbered headers and proper editorial typography.

### Move 2: Re-author the term page

- Collapse the 18 sections into 6: Hero (title + taxonomy + tier) →
  Definition → Why it matters → Where it fits (single composed
  diagram, not a pill wall) → Comparisons (max 3, not 12) → Your
  study (note + bookmark + share + read time).
- Move the rest behind a tab strip ("Compare / Quiz / Diagram / FAQ
  / Sources") that defaults to closed on mobile.
- The connection pill grid needs to die. Replace with a real concept
  graph or a list with proper editorial typography.

### Move 3: Re-author the Field Lab

- Drop the "9 big-number metric cards" hero metric grid. Replace
  with a single, designed "system status" panel: term count, path
  count, last ingest, build version, one paragraph of context.
- Drop the 4-card "Workflows" grid. The 4 cards are saying the same
  thing.
- Replace the 12-cell "Runtime blocks" grid with a single composed
  block-anatomy diagram that shows one block exploded into its 7
  fields. That is more informative and visually interesting than
  a 12-cell grid of the same template.
- Add a real interactive search box (currently a controlled
  input with no results panel) so the lab is actually a working
  inspector, not a poster.

### Move 4: Lift the typography and color system

- Pick a single display face and commit. The current Iowan + Avenir
  + Geist triple-pivot is fine, but the rules only land if the
  display and body are visually distinguishable. Currently the
  display weight is 700, body is 400, and the line-heights are
  close, so headings and body compete.
- Add a real type scale. Currently font sizes jump from 1.45rem
  to 1.55rem to 1.8rem — too close. Establish 5 steps with at
  least 1.25x ratio.
- Tint the neutrals toward the brand orange. Currently `--muted`
  is `oklch(0.556 0 0)` (pure gray) and the brand has a clear
  warm hue. The mismatch is subtle but it makes the design feel
  disconnected from its own accent.
- Add a true dark mode. The current `.dark` block exists but
  the design system is so light-mode-coupled that toggling it
  would break the radial-gradient hero background and the warm
  card gradients. Either commit to light-only and remove the
  dark variant, or design a real warm dark mode.

### Move 5: Mobile-first composition

- The mobile home page is currently "stack everything, one column."
  Rebuild the home page so that the *hero* has a vertical
  composition: lead headline at the top, then a portrait-orientation
  field-guide spread below, then continue cards, then the editorial
  strip. The continue cards should be a 1-column stack with full-
  width action surfaces (the user is on their phone, give them
  room to tap).
- The nav on mobile should collapse to a 5-item bottom tab bar
  with the most-used actions (Home, Explore, Paths, Saved, More).
  The current single-row nav is a desktop pattern that hurts on
  phones.

### Move 6: Brand mark

- Replace the orange "AG" square with a real mark. The product
  metaphor is "field guide." A field guide has a hand-drawn or
  engraved mark — not a flat square. A simple composed monogram
  in the display face, with the warm cream background, would
  actually match the rest of the system.

## 6. What I will NOT change (out of scope, by design)

- The data model, routes, or any backend. Visual and CSS only.
- The Tailwind v4 + shadcn setup. It is already in.
- The actual term content. The pages will continue to render the
  same data the same way; only the composition changes.
- The pricing page. It is the strongest of the lot; minor polish
  only.
- The Explore page. Minor polish only; it is the model for the
  rest.

## 7. Verification plan

For every change I will:

1. Re-run `python3 tools/capture_baseline.py` and diff the screenshots
   by name.
2. Re-read the term page, home page, and Field Lab and confirm the
   section count actually decreased (the goal is fewer sections, not
   more decoration).
3. Re-read mobile and tablet captures specifically — the desktop
   redesign must not regress small screens.
4. Check that no new AI-slop patterns are introduced: no border-left
   stripes, no gradient text, no flat identical card grids, no
   hero-metric templates.

## 8. Confidence and known gaps

- I have not interviewed a real user. All "is this legible" calls
  are inferential from the screenshots and code.
- I have not measured the actual term content quality. The design
  audit assumes the content model is sound and the term page is
  making good use of it.
- I have not tested accessibility (color contrast, focus order,
  screen reader). The current design looks broadly OK but that
  is a real gap.
- Confidence: 0.74.
