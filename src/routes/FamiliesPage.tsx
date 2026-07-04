import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useCatalog } from "../content/CatalogContext";
import { buildFamilyHighlights, familySlug } from "./familyHighlights";

export function FamiliesPage() {
  const { terms, paths, isLoading, error } = useCatalog();
  const highlights = useMemo(() => buildFamilyHighlights(terms), [terms]);
  const familyCards = useMemo(
    () =>
      highlights.map((family) => {
        const lanePaths = paths.filter(
          (path) =>
            path.category === family.title ||
            path.title.toLowerCase().includes(family.title.toLowerCase()) ||
            path.subCategory.toLowerCase().includes(family.title.toLowerCase()),
        );
        const laneTerms = family.terms
          .filter((term) => term.metadata.editorialTier !== "sparse")
          .slice(0, 2);
        const starterTerm = family.strongestTerm;

        return {
          ...family,
          laneTermCount: lanePaths.length,
          starterPath: lanePaths[0] ?? null,
          featuredLaneTerms: laneTerms,
          starterTerm,
        };
      }),
    [highlights, paths],
  );

  return (
    <section className="page-grid">
      <div className="section-header explore-heading">
        <p className="eyebrow">Flagship families</p>
        <h2>Start with the clusters that deserve a deeper read.</h2>
        <p>
          These families are where the product can be more visual, more comparative, and more
          memorable. They are the best on-ramp when you want curated learning instead of flat search.
        </p>
      </div>

      <section className="family-hero-strip">
        <article className="summary-card summary-emphasis">
          <p className="showcase-label">What this page does</p>
          <h3>It turns broad AI/ML topics into distinct study lanes.</h3>
          <p>
            Use this page to find the family that fits what you are learning right now, then move
            into the term pages, compare blocks, and deep dives.
          </p>
          <div className="shelf-links">
            <Link className="text-link" to="/explore">
              Open the library
            </Link>
            <Link className="text-link" to="/paths">
              Browse paths
            </Link>
            <Link className="text-link" to="/pricing">
              See membership
            </Link>
          </div>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Learning promise</p>
          <h3>Compare, quiz, annotate, and export from the same study graph.</h3>
          <p>
            The family rail is not another index. It is the curated doorway into the deeper parts
            of the corpus and the paid study workflow.
          </p>
        </article>
      </section>

      {!isLoading && !error ? (
        <section className="family-grid">
          {familyCards.map((family) => (
            <article key={family.title} className="family-card">
              <div className="family-card-head">
                <p className="showcase-label">{family.title}</p>
                <div className="term-tier-row">
                  <span className="term-tier term-tier-featured">{family.featuredCount} featured</span>
                  <span className="term-tier term-tier-standard">{family.count} total terms</span>
                  <span className="term-tier term-tier-featured">{family.laneTermCount} matching paths</span>
                </div>
              </div>
              <h3>{family.note}</h3>
              <p>{family.whyItMatters}</p>
              <div className="family-block">
                <strong>Study move</strong>
                <span>{family.studyMove}</span>
              </div>
              <div className="family-block">
                <strong>Boundary cue</strong>
                <span>{family.confusionCue}</span>
              </div>
              {family.featuredLaneTerms.length ? (
                <div className="family-lane-preview">
                  <p className="showcase-label">Starter terms in this family</p>
                  <div className="family-lane-chip-row">
                    {family.featuredLaneTerms.map((term) => (
                      <Link key={term.slug} className="text-link" to={`/term/${term.slug}`}>
                        {term.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="shelf-links">
                {family.terms.map((term) => (
                  <Link key={term.slug} className="text-link" to={`/term/${term.slug}`}>
                    {term.title}
                  </Link>
                ))}
              </div>
              <Link className="text-link" to={`/families/${familySlug(family.title)}`}>
                Open family lane
              </Link>
              {family.starterTerm ? (
                <Link className="primary-button" to={`/term/${family.starterTerm.slug}`}>
                  Open flagship term
                </Link>
              ) : null}
              {family.starterPath ? (
                <Link className="ghost-button" to={`/paths/${family.starterPath.slug}`}>
                  Start with a path
                </Link>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {isLoading ? (
        <article className="summary-card">
          <h3>Loading families</h3>
          <p>Reading the published catalog to group the deepest concept clusters.</p>
        </article>
      ) : error ? (
        <article className="summary-card">
          <h3>Family rail unavailable</h3>
          <p>{error}</p>
        </article>
      ) : null}
    </section>
  );
}
