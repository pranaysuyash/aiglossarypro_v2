import { Link } from "react-router-dom";
import { TermCard } from "../components/TermCard";
import { useCatalog } from "../content/CatalogContext";
import { buildFamilyHighlights, familySlug } from "./familyHighlights";

export function HomePage() {
  const { paths, terms, termMap, isLoading, error } = useCatalog();
  const featuredPaths = paths.slice(0, 3);
  const featuredCount = terms.filter((term) => term.metadata.editorialTier === "featured").length;
  const standardCount = terms.filter((term) => term.metadata.editorialTier === "standard").length;
  const sparseCount = terms.filter((term) => term.metadata.editorialTier === "sparse").length;
  const featuredTerms = [] as typeof terms;
  const seenFeaturedTermSlugs = new Set<string>();
  for (const path of featuredPaths) {
    for (const slug of path.featuredTermSlugs) {
      if (seenFeaturedTermSlugs.has(slug)) {
        continue;
      }
      seenFeaturedTermSlugs.add(slug);
      const term = termMap.get(slug);
      if (term) {
        featuredTerms.push(term);
      }
      if (featuredTerms.length >= 6) {
        break;
      }
    }
    if (featuredTerms.length >= 6) {
      break;
    }
  }
  const sampleTerm = featuredTerms[0] ?? terms.find((t) => t.metadata.editorialTier === "featured") ?? null;
  const familyCards = buildFamilyHighlights(terms).slice(0, 6);

  return (
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

          <div className="hero-runtime-grid">
            <article className="hero-runtime-card">
              <span>Published terms</span>
              <strong>{terms.length.toLocaleString()}</strong>
              <p>entries live for search and deep-link</p>
            </article>
            <article className="hero-runtime-card">
              <span>Guided paths</span>
              <strong>{paths.length.toLocaleString()}</strong>
              <p>inspectable learning trails</p>
            </article>
            <article className="hero-runtime-card">
              <span>Depth tiers</span>
              <strong>{featuredCount} featured</strong>
              <p>{standardCount} standard, {sparseCount} sparse</p>
            </article>
          </div>

          <div className="tier-row">
            <span className="tier-tag tier-featured">Featured concepts</span>
            <span className="tier-tag tier-standard">Standard corpus</span>
            <span className="tier-tag tier-sparse">Sparse tail</span>
          </div>

          <div className="hero-actions">
            <Link className="primary-button" to={sampleTerm ? `/term/${sampleTerm.slug}` : "/explore"}>
              Open a real term
            </Link>
            <Link className="ghost-button" to="/explore">
              Enter the library
            </Link>
            <Link className="ghost-button" to="/field-lab">
              Inspect the app
            </Link>
          </div>

          <div className="trust-row">
            <span>Paid, no free tier</span>
            <span>18k+ terms visible live</span>
            <span>Study memory with notes and bookmarks</span>
          </div>
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
            <p>
              Most AI learners drown in fragments spread across articles, tweets, paper abstracts, and
              YouTube tabs. This product is designed to be the one surface where the language of AI
              starts feeling native because you built the mental map yourself.
            </p>
            <div className="field-spread-chips">
              <span>{terms.length.toLocaleString()} terms</span>
              <span>{paths.length.toLocaleString()} paths</span>
              <span>{featuredCount} flagship</span>
              <span>Study memory</span>
            </div>
            <Link className="primary-button" to="/explore" style={{ width: "fit-content" }}>
              Start reading
            </Link>
          </article>

          <div className="concept-rail">
            {featuredPaths.length > 0
              ? featuredPaths.map((path) => (
                  <article key={path.slug} className="concept-card">
                    <p className="showcase-label">
                      {path.category} / {path.subCategory}
                    </p>
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                    <div className="chip-row">
                      <span>{path.termCount} terms</span>
                      <span>{path.featuredTermSlugs.length} anchors</span>
                    </div>
                    <Link className="text-link" to={`/paths/${path.slug}`}>
                      Open path
                    </Link>
                  </article>
                ))
              : (
                <article className="concept-card">
                  <p className="showcase-label">Published paths</p>
                  <h3>Loading real learning trails…</h3>
                  <p>These previews are generated from the live corpus, not sample content.</p>
                </article>
              )}
          </div>
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
                <strong>{featuredCount.toLocaleString()}</strong>
                <span>Featured</span>
              </div>
              <div className="continue-meta-cell">
                <strong>{standardCount.toLocaleString()}</strong>
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
  );
}
