import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ViewTransition } from "react";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import type { LearningPathRecord } from "../types";
import { useCatalog } from "../content/CatalogContext";
import { getTermBlocks } from "../content/termBlocks";
import { saveLastOpenedPathSlug } from "../study/storage";

export function PathDetailPage() {
  const { pathSlug = "" } = useParams();
  const { pathMap, termMap, loadPath, isLoading: isCatalogLoading, error: catalogError } = useCatalog();
  const [path, setPath] = useState<LearningPathRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadCurrentPath() {
      setIsLoading(true);
      setError(null);
      try {
        const payload = await loadPath(pathSlug);
        if (!isCancelled) {
          setPath(payload);
          if (!payload) {
            setError("This path is not present in the current published path catalog.");
          } else {
            saveLastOpenedPathSlug(payload.slug);
          }
        }
      } catch (loadError) {
        if (!isCancelled) {
          setPath(null);
          setError(loadError instanceof Error ? loadError.message : "Path load failed");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrentPath();

    return () => {
      isCancelled = true;
    };
  }, [loadPath, pathSlug]);

  const pathSummary = pathMap.get(pathSlug);
  const stageCounts = path?.steps.reduce<Record<string, number>>((accumulator, step) => {
    accumulator[step.stage] = (accumulator[step.stage] ?? 0) + 1;
    return accumulator;
  }, {}) ?? {};
  const featuredAnchors = path?.featuredTermTitles.slice(0, 6) ?? [];
  const featuredTerms =
    path?.featuredTermSlugs
      .map((slug) => termMap.get(slug))
      .filter((term): term is NonNullable<typeof term> => Boolean(term)) ?? [];
  const featuredFeaturedTerms = featuredTerms.filter((term) => term.metadata.editorialTier === "featured");
  const pathContentCounts = featuredTerms.reduce(
    (accumulator, term) => {
      for (const block of getTermBlocks(term)) {
        if (block.type === "quiz") {
          accumulator.quizzes += 1;
        } else if (block.type === "diagram") {
          accumulator.diagrams += 1;
        } else if (block.type === "faq") {
          accumulator.faqs += 1;
        } else if (block.type === "comparison") {
          accumulator.comparisons += 1;
        } else if (block.type === "deep-dive") {
          accumulator.deepDives += 1;
        }
      }
      return accumulator;
    },
    {
      quizzes: 0,
      diagrams: 0,
      faqs: 0,
      comparisons: 0,
      deepDives: 0,
    },
  );
  const depthCounts = {
    featured: featuredFeaturedTerms.length,
    standard: featuredTerms.filter((term) => term.metadata.editorialTier === "standard").length,
    sparse: featuredTerms.filter((term) => term.metadata.editorialTier === "sparse").length,
  };

  function exportPathPacket() {
    if (!path) {
      return;
    }

    const packet = {
      exportedAt: new Date().toISOString(),
      path,
      pathSummary,
      stageCounts,
      studyTrail: path.steps.map((step) => ({
        slug: step.slug,
        title: step.title,
        summary: step.summary,
        stage: step.stage,
        whyIncluded: step.whyIncluded,
      })),
    };

    const blob = new Blob([JSON.stringify(packet, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${path.slug}-path-packet.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  if (isCatalogLoading || isLoading) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Loading path…</h2>
        <p>Preparing the published learning trail.</p>
      </section>
      </DirectionalTransition>
    );
  }

  if (catalogError || error || !path) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Learning trail syncing</h2>
        <p>{error ?? catalogError ?? "This path could not be loaded."}</p>
        <Link className="text-link" to="/paths">
          Back to paths
        </Link>
      </section>
      </DirectionalTransition>
    );
  }

  return (
    <DirectionalTransition>
    <section className="page-grid">
      <article className="hero-card term-hero">
        <div className="term-hero-copy">
          <p className="eyebrow">
            {path.category} / {path.subCategory}
          </p>
          <ViewTransition name={`path-title-${path.slug}`} share="text-morph">
            <h1>{path.title}</h1>
          </ViewTransition>
          <p className="term-hero-intro">
            A guided trail through the concepts that belong together. Use it when you want a
            learning sequence instead of a search result list.
          </p>
          <p>{path.description}</p>
          <div className="shelf-links term-metrics">
            <span>{path.termCount} terms in cluster</span>
            <span>{path.steps.length} guided steps</span>
            <span>{Object.keys(stageCounts).length} path stages</span>
          </div>
          <div className="path-row">
            <span>{path.termCount} terms in cluster</span>
            <span>{path.steps.length} guided steps</span>
            <span>{path.featuredTermSlugs.length} anchors</span>
          </div>
          <div className="path-depth-row">
            <span>{depthCounts.featured} featured terms</span>
            <span>{depthCounts.standard} standard terms</span>
            <span>{depthCounts.sparse} sparse terms</span>
          </div>
          <div className="path-content-row">
            <span>{pathContentCounts.quizzes} quizzes</span>
            <span>{pathContentCounts.diagrams} diagrams</span>
            <span>{pathContentCounts.faqs} FAQs</span>
            <span>{pathContentCounts.comparisons} comparisons</span>
            <span>{pathContentCounts.deepDives} deep dives</span>
          </div>
          <div className="hero-actions">
            <button className="primary-button" onClick={exportPathPacket} type="button">
              Export path packet
            </button>
            <Link className="ghost-button" to="/saved">
              Review study shelf
            </Link>
          </div>
        </div>
        <div className="term-hero-rail">
          <article className="term-signal-card">
            <p className="showcase-label">Featured anchors</p>
            <div className="connection-pills">
              {featuredAnchors.map((title) => (
                <span key={title}>{title}</span>
              ))}
            </div>
          </article>
          {featuredFeaturedTerms.length ? (
            <article className="term-signal-card">
              <p className="showcase-label">Featured deep dives</p>
              <div className="path-featured-grid">
                {featuredFeaturedTerms.slice(0, 3).map((term) => (
                  <article key={term.slug} className="path-featured-card">
                    <p className={`term-tier term-tier-${term.metadata.editorialTier ?? "standard"}`}>
                      {term.metadata.editorialTier ?? "standard"}
                    </p>
                    <h3>{term.title}</h3>
                    <p>{term.summary}</p>
                    <Link className="text-link" to={`/term/${term.slug}`}>
                      Open {term.title}
                    </Link>
                  </article>
                ))}
              </div>
            </article>
          ) : null}
          {pathSummary ? (
            <article className="term-signal-card">
              <p className="showcase-label">Why this path exists</p>
              <p>
                This trail was generated from the densest current cluster inside {path.category},
                then ranked for foundations, build-up terms, and advanced extensions.
              </p>
            </article>
          ) : null}
          <article className="term-signal-card">
            <p className="showcase-label">Learning rhythm</p>
            <div className="connection-pills">
              {Object.entries(stageCounts).map(([stage, count]) => (
                <span key={stage}>
                  {count} {stage}
                </span>
              ))}
            </div>
          </article>
        </div>
      </article>

      <section className="path-content-rail">
        <div className="section-header">
          <p className="eyebrow">Content mix</p>
          <h3>This trail contains more than a list of term titles.</h3>
          <p>
            The featured concepts in the path carry interactive study blocks, so the sequence can
            guide a learner toward the right kind of reinforcement at each step.
          </p>
        </div>
        <div className="path-content-grid">
          <article className="path-content-card">
            <p className="showcase-label">Recall layer</p>
            <h3>
              {pathContentCounts.quizzes} quizzes and {pathContentCounts.faqs} FAQs
            </h3>
            <p>Useful for quick self-checks and concept refreshes before a deeper read.</p>
          </article>
          <article className="path-content-card">
            <p className="showcase-label">Visual layer</p>
            <h3>
              {pathContentCounts.diagrams} diagrams and {pathContentCounts.comparisons} comparisons
            </h3>
            <p>Useful for boundaries, analogies, and seeing what the term is versus what it is not.</p>
          </article>
          <article className="path-content-card">
            <p className="showcase-label">Flagship layer</p>
            <h3>{pathContentCounts.deepDives} deep dives</h3>
            <p>Useful for the highest-signal anchors that deserve the richest treatment.</p>
          </article>
        </div>
      </section>

      <section className="study-ribbon">
        {path.steps.slice(0, 3).map((step, index) => (
          <article key={step.slug} className="study-ribbon-card">
            <p className="ritual-index">{String(index + 1).padStart(2, "0")}</p>
            <h3>{step.title}</h3>
            <p>{step.whyIncluded}</p>
          </article>
        ))}
      </section>

      <section className="ritual-grid">
        {path.steps.map((step, index) => (
          <article key={step.slug} className="ritual-card">
            <p className="ritual-index">{String(index + 1).padStart(2, "0")}</p>
            <p className="eyebrow">{step.stage}</p>
            <h3>{step.title}</h3>
            <p>{step.whyIncluded}</p>
            <p>{step.summary}</p>
            <Link className="text-link" to={`/term/${step.slug}`}>
              Open term
            </Link>
          </article>
        ))}
      </section>
    </section>
    </DirectionalTransition>
  );
}
