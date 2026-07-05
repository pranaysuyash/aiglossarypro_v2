import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewTransition } from "react";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { useCatalog } from "../content/CatalogContext";
import { getTermBlocks } from "../content/termBlocks";
import type { TermBlock, TermRecord } from "../types";
import { buildInteractiveContentMix } from "../study/workspaceInsights";
import { buildFamilyHighlights, familySlug, getFamilyPaths, isFamilyMatch } from "./familyHighlights";

export function FamilyDetailPage() {
  const { familySlug: familySlugParam = "" } = useParams();
  const { terms, paths, loadTerm, isLoading, error } = useCatalog();
  const highlights = useMemo(() => buildFamilyHighlights(terms), [terms]);
  const [familyTermRecords, setFamilyTermRecords] = useState<Map<string, TermRecord>>(new Map());
  const family = highlights.find((item) => familySlug(item.title) === familySlugParam);
  const familyTerms = useMemo(
    () =>
      family
        ? terms.filter((term) => isFamilyMatch(term, family.title))
        : [],
    [family, terms],
  );
  const familyPaths = useMemo(() => (family ? getFamilyPaths(paths, family.title) : []), [family, paths]);
  const familyOrderedTerms = useMemo(() => {
    const copy = [...familyTerms];
    copy.sort((left, right) => {
      if (left.metadata.editorialTier !== right.metadata.editorialTier) {
        const leftTier = left.metadata.editorialTier ?? "standard";
        const rightTier = right.metadata.editorialTier ?? "standard";
        const score =
          (rightTier === "featured" ? 3 : rightTier === "standard" ? 2 : 1) -
          (leftTier === "featured" ? 3 : leftTier === "standard" ? 2 : 1);
        if (score !== 0) {
          return score;
        }
      }

      return left.title.localeCompare(right.title);
    });
    return copy;
  }, [familyTerms]);
  const featuredTerms = useMemo(
    () => familyTerms.filter((term) => term.metadata.editorialTier === "featured"),
    [familyTerms],
  );
  const familyInteractiveMix = useMemo(
    () => buildInteractiveContentMix(terms, featuredTerms.map((term) => term.slug)),
    [featuredTerms, terms],
  );
  const familySequenceWindow = useMemo(() => {
    const featuredSequence = featuredTerms.length ? featuredTerms : familyOrderedTerms;
    const nextTerms = featuredSequence.slice(0, 6);

    return {
      nextTerms,
      count: featuredSequence.length,
      entryTerm: nextTerms[0],
      lanePath: familyPaths[0] ?? null,
    };
  }, [familyPaths, featuredTerms, familyOrderedTerms]);
  const familyTermLookup = useMemo(
    () =>
      new Map(
        familyTerms.map((term) => [term.title.toLowerCase(), term]),
      ),
    [familyTerms],
  );
  const familySeedTerms = useMemo(() => familyTerms.slice(0, 12), [familyTerms]);
  const familySeedTermSlugs = useMemo(() => familySeedTerms.map((term) => term.slug), [familySeedTerms]);
  useEffect(() => {
    let isCancelled = false;
    if (!familySeedTermSlugs.length) {
      setFamilyTermRecords(new Map());
      return;
    }

    void (async () => {
      const nextMap = new Map<string, TermRecord>();

      await Promise.all(
        familySeedTermSlugs.map(async (slug) => {
          const fullTerm = await loadTerm(slug);
          if (!isCancelled && fullTerm) {
            nextMap.set(fullTerm.slug, fullTerm);
          }
        }),
      );

      if (!isCancelled) {
        setFamilyTermRecords(nextMap);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [familySeedTermSlugs, loadTerm]);
  const featuredFamilyWidgets = useMemo(() => {
    const seedTerms = featuredTerms.length ? featuredTerms : familyTerms;
    const widgets: Array<{
      type: "quiz" | "diagram" | "comparison" | "deep-dive";
      title: string;
      termSlug: string;
      termTitle: string;
      preview: string;
      note: string;
    }> = [];

    for (const term of seedTerms) {
      const blocks = getTermBlocks(familyTermRecords.get(term.slug) ?? term);
      const quiz = blocks.find((block): block is Extract<TermBlock, { type: "quiz" }> => block.type === "quiz");
      if (quiz) {
        widgets.push({
          type: "quiz",
          title: quiz.title,
          termSlug: term.slug,
          termTitle: term.title,
          preview: quiz.question,
          note: `${quiz.options.length} options · correct index ${quiz.answerIndex + 1}`,
        });
      }

      const diagram = blocks.find(
        (block): block is Extract<TermBlock, { type: "diagram" }> => block.type === "diagram",
      );
      if (diagram) {
        widgets.push({
          type: "diagram",
          title: diagram.title,
          termSlug: term.slug,
          termTitle: term.title,
          preview: `${diagram.lanes.length} lanes · ${diagram.center.label}`,
          note: diagram.takeaway,
        });
      }

      const deepDive = blocks.find(
        (block): block is Extract<TermBlock, { type: "deep-dive" }> => block.type === "deep-dive",
      );
      if (deepDive) {
        widgets.push({
          type: "deep-dive",
          title: deepDive.title,
          termSlug: term.slug,
          termTitle: term.title,
          preview: deepDive.takeaway,
          note: `${deepDive.panels.length} panel(s) available`,
        });
      }

      const comparison = blocks.find(
        (block): block is Extract<TermBlock, { type: "comparison" }> => block.type === "comparison",
      );
      if (comparison) {
        widgets.push({
          type: "comparison",
          title: comparison.title,
          termSlug: term.slug,
          termTitle: term.title,
          preview: comparison.takeaway,
          note: `${comparison.panels.length} comparison panel(s)`,
        });
      }

      if (widgets.length >= 8) {
        break;
      }
    }

    return widgets;
  }, [familyTermRecords, featuredTerms, familyTerms]);

  const comparisonPairs = useMemo(() => {
    const pairs: Array<{ anchor: string; neighbor: string; anchorSlug: string; neighborSlug: string }> = [];

    featuredTerms.forEach((term) => {
      const relatives: (typeof familyTerms)[number][] = [];

      for (const title of term.links.related) {
        const match = familyTermLookup.get(title.toLowerCase());
        if (match && match.slug !== term.slug) {
          relatives.push(match);
        }
        if (relatives.length >= 2) {
          break;
        }
      }

      for (const related of relatives) {
        pairs.push({
          anchor: term.title,
          neighbor: related.title,
          anchorSlug: term.slug,
          neighborSlug: related.slug,
        });
      }
    });

    return pairs.slice(0, 6);
  }, [featuredTerms, familyTermLookup]);

  if (isLoading) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Loading family lane…</h2>
        <p>Reading the published catalog to open the selected study cluster.</p>
      </section>
      </DirectionalTransition>
    );
  }

  if (error) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Family lane unavailable</h2>
        <p>{error}</p>
        <Button variant="link" asChild><Link to="/families">
          Back to families
        </Link></Button>
      </section>
      </DirectionalTransition>
    );
  }

  if (!family) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Family not found</h2>
        <p>This flagship family is not present in the current published catalog.</p>
        <Button variant="link" asChild><Link to="/families">
          Back to families
        </Link></Button>
      </section>
      </DirectionalTransition>
    );
  }

  const activeFamily = family;
  const studyTrail = [
    activeFamily.featuredCount ? "Start with a featured deep dive" : "Start with the overview block",
    "Compare the nearest neighbors",
    "Open a related path",
    "Export the family packet",
  ];

  function exportFamilyPacket() {
    const packet = {
      exportedAt: new Date().toISOString(),
      family: {
        title: activeFamily.title,
        note: activeFamily.note,
        whyItMatters: activeFamily.whyItMatters,
        studyMove: activeFamily.studyMove,
        confusionCue: activeFamily.confusionCue,
      },
      featuredTerms: featuredTerms.map((term) => ({
        slug: term.slug,
        title: term.title,
        summary: term.summary,
        tier: term.metadata.editorialTier ?? "standard",
      })),
      relatedTerms: familyTerms.slice(0, 12).map((term) => ({
        slug: term.slug,
        title: term.title,
        summary: term.summary,
        tier: term.metadata.editorialTier ?? "standard",
      })),
      relatedPaths: familyPaths.map((path) => ({
        slug: path.slug,
        title: path.title,
        description: path.description,
      })),
    };

    const blob = new Blob([JSON.stringify(packet, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${family?.title ? `${familySlug(family.title)}-study-packet.json` : "family-study-packet.json"}`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <DirectionalTransition>
    <section className="page-grid">
      <article className="hero-card term-hero">
        <div className="term-hero-copy">
          <p className="eyebrow">Flagship family</p>
          <ViewTransition name={`family-title-${familySlugParam}`} share="text-morph">
            <h1>{family.title}</h1>
          </ViewTransition>
          <p className="term-hero-intro">{family.note}</p>
          <p>{family.whyItMatters}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="metric">{familyTerms.length} terms in this family</Badge>
            <Badge variant="metric">{featuredTerms.length} featured concepts</Badge>
            <Badge variant="metric">{familyPaths.length} related paths</Badge>
          </div>
          <div className="hero-actions">
            <Button variant="accent" asChild>
              <Link to="/explore">Browse library</Link>
            </Button>
            <Button variant="raised" asChild>
              <Link to="/paths">Browse paths</Link>
            </Button>
            <Button variant="raised" asChild>
              <Link to="/pricing">Review membership</Link>
            </Button>
            <Button variant="raised" onClick={exportFamilyPacket}>
              Export family packet
            </Button>
          </div>
        </div>
        <div className="term-hero-rail">
          <article className="term-signal-card">
            <p className="showcase-label">Study move</p>
            <p>{family.studyMove}</p>
          </article>
          <article className="term-signal-card">
            <p className="showcase-label">Boundary cue</p>
            <p>{family.confusionCue}</p>
          </article>
        <article className="term-signal-card">
            <p className="showcase-label">Workspace continuity</p>
            <p>Your notes and bookmarks can stay attached to the same study account once you sign in.</p>
            <div className="hero-actions">
              <Button variant="raised" size="sm" asChild>
                <Link to="/notes">Open notes</Link>
              </Button>
              <Button variant="raised" size="sm" asChild>
                <Link to="/saved">Open study shelf</Link>
              </Button>
            </div>
          </article>
          <article className="term-signal-card">
            <p className="showcase-label">Family lane start</p>
            <p>
              {familySequenceWindow.entryTerm
                ? `Start with ${familySequenceWindow.entryTerm.title} then move to neighboring flagship terms.`
                : "Start with the first high-confidence terms in this family lane."}
            </p>
            <div className="hero-actions">
              {familySequenceWindow.entryTerm ? (
                <Button variant="raised" size="sm" asChild>
                  <Link to={`/term/${familySequenceWindow.entryTerm.slug}`}>
                    Open lane entry
                  </Link>
                </Button>
              ) : null}
              {familySequenceWindow.lanePath ? (
                <Button variant="raised" size="sm" asChild>
                  <Link to={`/paths/${familySequenceWindow.lanePath.slug}`}>
                    Open related path
                  </Link>
                </Button>
              ) : null}
            </div>
          </article>
        </div>
      </article>

      <section className="family-grid">
        <article className="summary-card">
          <p className="showcase-label">Why this lane exists</p>
          <h3>Some clusters need a more visual, comparative treatment.</h3>
          <p>
            This page keeps the important families distinct so the learner can compare concepts,
            not just scan a list of term names.
          </p>
        </article>
        <article className="summary-card">
          <p className="showcase-label">How to use it</p>
          <h3>Read one featured concept, then move sideways before moving on.</h3>
          <p>
            Start with the flagship concepts, compare the neighboring ideas, and then jump into the
            path or term pages when you want the next layer.
          </p>
        </article>
      </section>

      <section className="family-trail-grid">
        {studyTrail.map((step, index) => (
          <article key={step} className="family-trail-card">
            <p className="ritual-index">{String(index + 1).padStart(2, "0")}</p>
            <h3>{step}</h3>
          </article>
        ))}
      </section>

      <section className="family-content-rail">
        <div className="section-header">
          <p className="eyebrow">Interactive family mix</p>
          <h2>This lane already contains the depth signals that make the product feel premium.</h2>
          <p>
            The featured terms in the family are what carry the visual proof. They give the lane
            a stronger balance of quizzes, diagrams, FAQs, comparisons, and deep dives.
          </p>
        </div>
        <div className="family-content-grid">
          <article className="family-content-card">
            <p className="showcase-label">Recall</p>
            <h3>
              {familyInteractiveMix.quizzes} quizzes and {familyInteractiveMix.faqs} FAQs
            </h3>
            <p>Use these for quick checks when you want to remember the family without rereading everything.</p>
          </article>
          <article className="family-content-card">
            <p className="showcase-label">Visual comparison</p>
            <h3>
              {familyInteractiveMix.diagrams} diagrams and {familyInteractiveMix.comparisons} comparisons
            </h3>
            <p>Use these to keep boundaries visible as the family expands across neighboring ideas.</p>
          </article>
          <article className="family-content-card">
            <p className="showcase-label">Flagship depth</p>
            <h3>{familyInteractiveMix.deepDives} deep dives</h3>
            <p>Use these as the richer entry points when the family deserves a more authored study path.</p>
          </article>
        </div>
      </section>

      <section className="section-header">
        <p className="eyebrow">Family lane sequence</p>
        <h2>Start with the strongest anchors, then move across the map.</h2>
      </section>
      <section className="family-lane-grid">
        {familySequenceWindow.nextTerms.length ? (
          familySequenceWindow.nextTerms.map((term, index) => (
            <article key={term.slug} className="family-card">
              <div className="flex flex-wrap gap-2">
                <Badge variant="tier">
                  Step {index + 1}
                </Badge>
              </div>
              <p className="showcase-label">{family.title}</p>
              <h3>{term.title}</h3>
              <p>{term.summary}</p>
              <Button variant="link" asChild><Link to={`/term/${term.slug}`}>
                Open lane term
              </Link></Button>
            </article>
          ))
        ) : (
          <article className="summary-card">
            <h3>Lane is sparse</h3>
            <p>This family currently has few enriched terms. The study path remains valid through path and search surfaces.</p>
          </article>
        )}
      </section>

      <section className="section-header">
        <p className="eyebrow">Featured terms</p>
        <h2>The richest terms in this family.</h2>
      </section>
      <section className="family-grid">
        {featuredTerms.map((term) => (
          <article key={term.slug} className="family-card">
            <div className="family-card-head">
              <p className="showcase-label">{term.title}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="tier">
                  {term.metadata.editorialTier ?? "standard"}
                </Badge>
              </div>
            </div>
            <p>{term.summary}</p>
            <Button variant="link" asChild><Link to={`/term/${term.slug}`}>
              Open {term.title}
            </Link></Button>
          </article>
        ))}
      </section>

      <section className="section-header">
        <p className="eyebrow">Interactive family surface</p>
        <h2>Featured interactive widgets you can read before opening each term.</h2>
      </section>
      <section className="family-grid">
        {featuredFamilyWidgets.length ? (
          featuredFamilyWidgets.map((widget) => (
            <article key={`${widget.type}-${widget.termSlug}-${widget.title}`} className="family-card">
              <p className="showcase-label">{widget.type}</p>
              <h3>{widget.title}</h3>
              <p>{widget.preview}</p>
              <p>{widget.note}</p>
              <Button variant="link" asChild><Link to={`/term/${widget.termSlug}`}>
                Open {widget.termTitle}
              </Link></Button>
            </article>
          ))
        ) : (
          <article className="summary-card">
            <h3>No family widgets yet</h3>
            <p>This family still has launch surface terms; interactive widgets become available as more featured terms are enriched.</p>
          </article>
        )}
      </section>

      <section className="section-header">
        <p className="eyebrow">Family comparison map</p>
        <h2>Compare nearby featured terms before moving off the family lane.</h2>
      </section>
      <section className="family-grid">
        {comparisonPairs.length ? (
          comparisonPairs.map((pair) => (
            <article key={`${pair.anchorSlug}-${pair.neighborSlug}`} className="family-card">
              <p className="showcase-label">{pair.anchor} ↔ {pair.neighbor}</p>
              <div className="hero-actions">
                <Button variant="link" asChild><Link to={`/term/${pair.anchorSlug}`}>
                  Open anchor
                </Link></Button>
                <span>vs</span>
                <Button variant="link" asChild><Link to={`/term/${pair.neighborSlug}`}>
                  Open neighbor
                </Link></Button>
              </div>
            </article>
          ))
        ) : (
          <article className="summary-card">
            <h3>No direct feature pairings yet</h3>
            <p>This family has fewer in-graph feature edges. Use related links or open the library to build comparison routes.</p>
          </article>
        )}
      </section>

      <section className="section-header">
        <p className="eyebrow">Related terms</p>
        <h2>Broader cluster around this family.</h2>
      </section>
      <section className="family-grid">
        {familyTerms.slice(0, 8).map((term) => (
          <article key={term.slug} className="family-card">
            <p className="showcase-label">{term.title}</p>
            <p>{term.summary}</p>
            <Button variant="link" asChild><Link to={`/term/${term.slug}`}>
              Open term
            </Link></Button>
          </article>
        ))}
      </section>

      <section className="section-header">
        <p className="eyebrow">Related paths</p>
        <h2>Study trails that connect this family to the rest of the corpus.</h2>
      </section>
      <section className="family-grid">
        {familyPaths.length ? (
          familyPaths.map((path) => (
            <article key={path.slug} className="family-card">
              <p className="showcase-label">{path.title}</p>
              <p>{path.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="chip">{path.termCount} terms</Badge>
                <Badge variant="chip">{path.featuredTermSlugs.length} featured anchors</Badge>
              </div>
              <Button variant="link" asChild><Link to={`/paths/${path.slug}`} aria-label={`Open trail: ${path.title}`}>
                Open path
              </Link></Button>
            </article>
          ))
        ) : (
          <article className="summary-card">
            <h3>No matching paths yet</h3>
            <p>The family is still useful as a standalone study lane even when no path is directly tagged.</p>
          </article>
        )}
      </section>

      {familyPaths.length ? (
        <article className="summary-card summary-emphasis">
          <p className="showcase-label">Best path entry</p>
          <h3>
            {familyPaths[0].title}
          </h3>
          <p>
            Start here if you want a structured sequence rather than browsing one term at a time.
          </p>
          <div className="hero-actions">
            <Button variant="accent" asChild>
              <Link to={`/paths/${familyPaths[0].slug}`}>Open recommended path</Link>
            </Button>
          </div>
        </article>
      ) : null}
    </section>
    </DirectionalTransition>
  );
}
