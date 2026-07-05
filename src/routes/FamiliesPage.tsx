import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewTransition } from "react";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { useCatalog } from "../content/CatalogContext";
import { buildFamilyHighlights, familySlug, getFamilyPaths } from "./familyHighlights";

export function FamiliesPage() {
  const { terms, paths, isLoading, error } = useCatalog();
  const highlights = useMemo(() => buildFamilyHighlights(terms), [terms]);
  const familyCards = useMemo(
    () =>
      highlights.map((family) => {
        const lanePaths = getFamilyPaths(paths, family.title);
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
  const compassMaxCount = familyCards[0]?.count ?? 1;
  const compassLanes = useMemo(
    () =>
      familyCards.slice(0, 3).map((family, index) => ({
        ...family,
        rank: index + 1,
        focusTerm: family.featuredLaneTerms[0] ?? family.starterTerm,
      })),
    [familyCards],
  );

  return (
    <DirectionalTransition>
    <section className="page-grid">
      <div className="section-header explore-heading">
        <p className="eyebrow">Flagship families</p>
        <h1>Start with the clusters that carry the most learning depth.</h1>
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
          <div className="flex flex-wrap gap-2">
            <Badge variant="metric" asChild><Link to="/explore">
              Open the library
            </Link></Badge>
            <Badge variant="metric" asChild><Link to="/paths">
              Browse paths
            </Link></Badge>
            <Badge variant="metric" asChild><Link to="/pricing">
              Review membership
            </Link></Badge>
          </div>
          <div className="family-compass" aria-label="Top study lanes">
            {compassLanes.map((lane) => (
              <article key={lane.title} className="family-compass-row">
                <span className="family-compass-index">0{lane.rank}</span>
                <div className="family-compass-copy">
                  <strong>{lane.title}</strong>
                  <span>
                    {lane.count.toLocaleString()} terms, {lane.featuredCount} featured,{" "}
                    {lane.laneTermCount} matching paths
                  </span>
                  <p>{lane.focusTerm ? `Start from ${lane.focusTerm.title}.` : "Start from the family anchor."}</p>
                </div>
                <div className="family-compass-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.max(22, Math.min(100, (lane.count / compassMaxCount) * 100))}%`,
                    }}
                  />
                </div>
              </article>
            ))}
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
            <article key={family.title} className="family-card" style={{ contentVisibility: "auto", containIntrinsicSize: "0 150px" }}>
              <ViewTransition name={`family-title-${familySlug(family.title)}`} share="text-morph" default="none">
                <div className="family-card-head">
                  <p className="showcase-label">{family.title}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="tier">{family.featuredCount} featured</Badge>
                  <Badge variant="tier">{family.count} total terms</Badge>
                  <Badge variant="tier">{family.laneTermCount} matching paths</Badge>
                </div>
                </div>
              </ViewTransition>
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
                  <div className="flex flex-wrap gap-2">
                    {family.featuredLaneTerms.map((term) => (
                    <Badge key={term.slug} variant="chip" asChild><Link to={`/term/${term.slug}`}>
                      {term.title}
                    </Link></Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {family.terms.map((term) => (
                  <Badge key={term.slug} variant="metric" asChild><Link to={`/term/${term.slug}`}>
                    {term.title}
                  </Link></Badge>
                ))}
              </div>
              <Button variant="link" asChild><Link to={`/families/${familySlug(family.title)}`}>
                Open family lane
              </Link></Button>
              {family.starterTerm ? (
                <Button variant="accent" size="md" asChild><Link to={`/term/${family.starterTerm.slug}`}>
                  Open flagship term
                </Link></Button>
              ) : null}
              {family.starterPath ? (
                <Button variant="raised" size="md" asChild><Link to={`/paths/${family.starterPath.slug}`}>
                  Start with a path
                </Link></Button>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {isLoading ? (
        <article className="summary-card">
          <h3>Loading families…</h3>
          <p>Reading the published catalog to group the deepest concept clusters.</p>
        </article>
      ) : error ? (
        <article className="summary-card">
          <h3>Family rail unavailable</h3>
          <p>{error}</p>
        </article>
      ) : null}
    </section>
    </DirectionalTransition>
  );
}
