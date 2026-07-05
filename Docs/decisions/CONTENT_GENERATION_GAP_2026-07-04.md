# Content generation gap — scope and plan

Date: 2026-07-04
Status: Investigated, not yet implemented. Needs a go/no-go on real spend before Phase 1.

## The finding

Out of 18,075 published terms, only **205 rows** in `data_glossary.xlsx` (`main`
column H) contain any human-authored definition text at all
(`tools/build_published_content.py:9`, verified by direct scan). Everything
else — including terms tagged `"featured"` — has zero real subject-matter
content. What currently ships as "quiz," "FAQ," "deep dive," and "comparison"
for the other ~17,870 terms is a fixed sentence template with the term name
substituted in, built entirely from **graph metadata** (taxonomy category,
prerequisite/related/next links), never from what the term actually means.

Concretely, in `tools/build_published_content.py`:

- `build_quiz_block` (line 1257): the question is always a meta-question about
  *navigation* ("what should you review first"), never about the concept.
  Two of four options are joke distractors ("Memorize the title only," "Skip
  straight to the next topic") no real quiz would include.
- `build_faq_block` (line 1370): question 1 reuses the summary verbatim,
  questions 2–3 are template sentences about prerequisites/comparisons.
- `build_deep_dive_block` (line 1433) and `build_comparison_block` (line 1488):
  the "Core idea" / "What it is" panel is `summary.split(". ")[0]` — the first
  sentence of the summary, not new content. Every other panel is graph
  narration ("read it inside X," "compare with Y").
- `build_summary` (line 1606): for the ~17,870 terms without a real
  definition, the summary itself is synthetic: `"{title} belongs to the {category}
  area of AI/ML"` or, failing that, `"{title} is a glossary node in the AI/ML
  learning graph."` That second fallback describes nothing about the term.

This is not a frontend bug. It's a content-authoring gap at the foundation of
the product's "premium interactive study system" pitch.

## What real signal already exists per term (usable as LLM input)

- Term title, aliases
- Taxonomy: category / sub-category / topic
- Graph links: prerequisites, related, next, alternatives (derived from the
  structure workbook, real and reliable)
- Study family (editorial grouping)
- For 205 terms: a real one-sentence definition

## The workbook is not the long-term source of truth — correcting course

The plan below originally treated `data_glossary.xlsx` as the thing content
generation reads from indefinitely. That's wrong, and worth stating plainly:
the workbook is a **bootstrap import artifact**, not infrastructure. Evidence:

- It has 15 sheets; per the build script's own header comment, only a
  handful of columns across two of them are actually load-bearing (`main`
  A/B/D:G for the term inventory, N:P for a taxonomy lookup, H for the 205
  real definitions). The rest (`prompt gallery`, `o1-mini`, `together ai api`,
  `FINAL`, `Sheet6`...`Sheet17`) are leftover debris from earlier ad hoc
  authoring sessions, not designed schema.
- There is no schema, no validation, no versioning, no review workflow, and
  no way for a human editor and an automated authoring job to touch the same
  term safely — a parser has to infer meaning from column *position*, and a
  reordered sheet or inserted column silently corrupts term data with nothing
  to catch it.
- Treating it as permanent means every future content improvement has to be
  smuggled back into spreadsheet cells, which compounds the fragility instead
  of fixing it.

**The correct target:** promote term content to a first-class structured
store with a real schema and provenance, the same way this app already
handles user data. `infra/d1/schema.sql` already runs D1 for `users` and
`entitlements` — a `term_content` table (or versioned per-term JSON with an
equivalent schema) belongs in the same place, with columns like
`generated_by`, `reviewed_by`, `reviewed_at`, `source_definition_id`.

**The workbook's job shrinks to exactly one thing:** a one-time historical
import of the term inventory, taxonomy, and the 205 real definitions into
that new store. After that single import runs, `build_published_content.py`
stops reading `data_glossary.xlsx` at all — it becomes a historical artifact,
not a build dependency. The current "bake static JSON shards for fast
delivery" *runtime* behavior is fine to keep; that was never the problem.
The problem was always the authoring source feeding it.

This changes Phase 0 below: the pilot script should read from a fresh
one-time import table/JSON (seeded once from the workbook), not from the
workbook directly, so the migration off Excel happens immediately rather than
being deferred to "someday."

## Recommended plan (not yet started)

**Phase 0 — pilot (do first, cheap, no commitment).**
Write a standalone authoring script (`tools/authoring/generate_term_content.py`
or similar) that calls the Claude API once per term with: title, taxonomy,
graph links, and the real definition if one exists. Ask it to produce, in a
strict JSON schema matching the existing `TermBlock` shapes:
- a real 2–4 sentence explanation of what the term *is*
- 3 real FAQ questions that test understanding, not navigation
- 1 real quiz question with 4 plausible (non-joke) options testing a genuine
  misconception
- a real "what it is / what it is not / common confusion" comparison
- a real deep-dive covering how it works and why it matters

Run this on ~40 terms spanning featured/standard/sparse tiers and different
categories. Review output by hand for factual accuracy (LLM hallucination risk
on niche ML terms is real and needs a human pass, not just a vibe check).

**Phase 1 — featured tier (~200 terms).** Highest visibility (paths, family
lanes, home page all surface featured terms first). Full content depth per
term. Small enough to hand-review every single output before publishing.

**Phase 2 — standard tier (bulk of the corpus).** Same generation, run at
scale via the Claude Batch API (roughly half the per-token cost, async
turnaround). Spot-check a statistical sample rather than every term.

**Phase 3 — sparse tier.** Lower ambition by design: a real definition and one
real FAQ, skip quiz/deep-dive/comparison rather than force depth onto terms
that don't warrant it. (Matches the tier's own name — "sparse" should mean
honestly short, not fake-deep.)

**Integration approach (corrected):**
1. One-time migration script reads `data_glossary.xlsx` + the structure
   workbook exactly once, and writes every term's inventory/taxonomy/graph
   links/existing-definition into the new structured store (D1 table or
   versioned per-term JSON under source control). This is the *last* time
   anything in the pipeline reads the Excel file.
2. The authoring script (Phase 0+) reads from that store, not from Excel,
   and writes its generated content back into the same store with
   provenance fields set.
3. `build_published_content.py` is repointed to read term records from the
   structured store instead of the workbook. It keeps doing exactly what it
   does today after that — publish static JSON shards for the runtime to
   fetch — just from a real source instead of a spreadsheet.
4. Once step 3 ships, `data_glossary.xlsx` and `data_structure.xlsx` can be
   archived (kept for history, per the no-deleting-history rule) but are no
   longer a build dependency.

## Why this needs a go/no-go before Phase 1

Phase 0 is free to greenlight (small pilot, bounded cost). Phase 1–3 involve
real API spend at 18k-term scale and non-trivial wall-clock time, plus a
non-trivial human review pass to catch hallucinations on niche/adjacent terms
— that's a budget and process decision, not a purely technical one.

## Confidence and gaps

- Confidence the diagnosis is correct: high — verified directly against the
  generation source and a live workbook scan, not inferred.
- Not yet estimated: exact token/cost figures (depends on model choice and
  final prompt length — should be measured from the Phase 0 pilot output,
  not guessed up front).
- Not yet decided: which model to use for generation (favor a stronger model
  for factual reliability on a technical corpus; cheaper models risk
  confidently wrong ML definitions, which would be worse than the current
  honest-but-empty templates).
