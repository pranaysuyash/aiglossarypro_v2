import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ViewTransition } from "react";
import { TermCard } from "../components/domain/term/TermCard";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { useCatalog } from "../content/CatalogContext";
import { buildFamilyHighlights, familySlug } from "./familyHighlights";

export function HomePage() {
  const { paths, terms, termMap, isLoading, error, reloadCatalog } = useCatalog();
  const featuredPaths = paths.slice(0, 3);

  const tierCounts = useMemo(() => {
    let featured = 0;
    let standard = 0;
    let sparse = 0;
    for (const term of terms) {
      if (term.metadata.editorialTier === "featured") featured++;
      else if (term.metadata.editorialTier === "standard") standard++;
      else sparse++;
    }
    return { featured, standard, sparse };
  }, [terms]);

  const featuredTerms = useMemo(() => {
    const result: typeof terms = [];
    const seen = new Set<string>();
    for (const path of featuredPaths) {
      for (const slug of path.featuredTermSlugs) {
        if (seen.has(slug)) continue;
        seen.add(slug);
        const term = termMap.get(slug);
        if (term) result.push(term);
        if (result.length >= 6) break;
      }
      if (result.length >= 6) break;
    }
    return result;
  }, [featuredPaths, termMap]);

  const sampleTerm = useMemo(
    () => featuredTerms[0] ?? terms.find((t) => t.metadata.editorialTier === "featured") ?? null,
    [featuredTerms, terms],
  );

  const familyCards = useMemo(() => buildFamilyHighlights(terms).slice(0, 6), [terms]);

  return (
    <DirectionalTransition>
    <div className="page-grid">
      {/* ---- HERO ---- */}
      <section className="hero-home">
        <div className="hero-copy">
          <p className="eyebrow">AIGlossary Pro</p>
          <h2>Learn AI language as a system, not a glossary.</h2>
          <p className="hero-lead">
            A disciplined private study surface for people who need to read, think, take notes, and
            return to the same concepts with memory — not another browser tab that rots.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to={sampleTerm ? `/term/${sampleTerm.slug}` : "/explore"}>
              Open a real term
            </Link>
            <Link className="ghost-button" to="/explore">
              Enter the library
            </Link>
          </div>

          <p className="hero-stat-line">
            {terms.length.toLocaleString()} terms · {paths.length.toLocaleString()} guided paths · {tierCounts.featured} flagship deep dives · paid membership, no free tier
          </p>
        </div>

        <div className="hero-rail">
          <article className="field-spread">
            <div className="field-spread-header">
              <p className="field-spread-kicker">Field guide</p>
              <h3>
                The app should feel like stepping into a disciplined private library — not a SaaS
                dashboard, not a forum thread, not a doc page.
              </h3>
            </div>
            <div className="field-spread-chips">
              <span>{terms.length.toLocaleString()} terms</span>
              <span>{paths.length.toLocaleString()} paths</span>
              <span>Study memory</span>
            </div>
            <Link className="primary-button" to="/explore" style={{ width: "fit-content" }}>
              Start reading
            </Link>
          </article>
        </div>
      </section>

      {/* ---- CONTINUE LEARNING ---- */}
      <section>
        <div className="section-header">
          <p className="eyebrow">Return to study</p>
          <h2>Pick up where you left off.</h2>
          <p>
            The app is designed for return visits. Bookmarks, notes, annotations, and path memory
            accumulate across sessions.
          </p>
        </div>

        <div className="continue-strip">
          <article className="continue-panel continue-panel-accent">
            <h3>Continue reading</h3>
            <p>Jump back to your last bookmarked term or path. Memory builds across sessions.</p>
            <div className="continue-meta-grid">
              <div className="continue-meta-cell">
                <strong>{terms.length.toLocaleString()}</strong>
                <span>Terms ready</span>
              </div>
              <div className="continue-meta-cell">
                <strong>{tierCounts.featured.toLocaleString()}</strong>
                <span>Featured</span>
              </div>
              <div className="continue-meta-cell">
                <strong>{tierCounts.standard.toLocaleString()}</strong>
                <span>Standard</span>
              </div>
            </div>
            <Link className="text-link" to={sampleTerm ? `/term/${sampleTerm.slug}` : "/explore"}>
              Open a term
            </Link>
          </article>

          <article className="continue-panel continue-panel-secondary">
            <h3>Follow a path</h3>
            <p>Structured topic trails. Move through prerequisites, core concepts, and next steps.</p>
            <div className="chip-row">
              {featuredPaths.slice(0, 4).map((p) => (
                <Link key={p.slug} className="pill pill-link" to={`/paths/${p.slug}`}>
                  {p.title}
                </Link>
              ))}
            </div>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", margin: 0 }}>
              {paths.length} paths available. Each path is a deliberate sequence, not a keyword blob.
            </p>
          </article>

          <article className="continue-panel continue-panel-gold">
            <h3>Your study memory</h3>
            <p>Bookmarks, notes, annotations, and exports. Your personal knowledge graph grows here.</p>
            <div className="hero-actions">
              <Link className="ghost-button" to="/saved">
                Open saved
              </Link>
              <Link className="ghost-button" to="/notes">
                Open notebook
              </Link>
            </div>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", margin: 0 }}>
              Private. Never shared. Exportable as markdown and JSON.
            </p>
          </article>
        </div>
      </section>

      {/* ---- FLAGSHIP FAMILIES ---- */}
      {familyCards.length > 0 ? (
        <section>
          <div className="section-header">
            <p className="eyebrow">Concept families</p>
            <h2>The deepest content is authored, not uniformly generated.</h2>
            <p>
              These are the concept families where comparisons, quizzes, and deep dives are strongest
              so the learning experience feels curated rather than flat.
            </p>
          </div>

          <div className="family-lane-grid">
            {familyCards.map((family) => (
              <article key={family.title} className="family-lane-card">
                <p className="showcase-label">{family.title}</p>
                <h3>{family.note}</h3>
                <p>{family.whyItMatters}</p>
                <div className="family-lane-chip-row">
                  <span>{family.count} terms</span>
                  <span>{family.featuredCount} flagship</span>
                </div>
                <div className="hero-actions">
                  <Link className="text-link" to={`/families/${familySlug(family.title)}`}>
                    Family lane
                  </Link>
                  {family.strongestTerm ? (
                    <Link className="text-link" to={`/term/${family.strongestTerm.slug}`}>
                      Start here
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---- INSIDE THE LIBRARY ---- */}
      <section className="editorial-strip">
        <div className="section-header">
          <p className="eyebrow">Inside the library</p>
          <h2>Definitions are only the front door.</h2>
          <p>
            The real value is returning to the same concept network with memory, intent, and your
            own accumulated notes. That is the difference between reference material and a learning
            product.
          </p>
        </div>

        {isLoading ? (
          <article className="summary-card">
            <h3>Loading catalog…</h3>
            <p>Reading the current published term manifest.</p>
          </article>
        ) : error ? (
          <article className="summary-card">
            <h3>Catalog unavailable</h3>
            <p>{error}</p>
            <button className="ghost-button" type="button" onClick={reloadCatalog}>
              Retry load
            </button>
          </article>
        ) : (
          <div className="featured-grid">
            {featuredTerms.map((term) => (
              <TermCard key={term.slug} term={term} />
            ))}
          </div>
        )}
      </section>
    </div>
    </DirectionalTransition>
  );
}
