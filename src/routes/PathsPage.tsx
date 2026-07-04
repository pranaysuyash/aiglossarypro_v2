import { Link } from "react-router-dom";
import { useCatalog } from "../content/CatalogContext";

export function PathsPage() {
  const { paths, isLoading, error } = useCatalog();
  const featuredPaths = paths.slice(0, 6);
  const categoryCount = new Set(paths.map((path) => path.category)).size;

  return (
    <section className="page-grid">
      <div className="section-header explore-heading">
        <p className="eyebrow">Paths</p>
        <h2>Follow concept trails instead of hopping between isolated terms.</h2>
        <p>
          These generated paths turn the glossary into guided terrain. Each one starts from a
          category cluster and sequences the terms most likely to help a learner build momentum.
        </p>
      </div>
      {!isLoading && !error ? (
        <section className="browse-lenses">
          <article className="browse-lens-card">
            <p className="showcase-label">Path coverage</p>
            <h3>{paths.length} curated trails</h3>
            <p>{categoryCount} top-level categories represented in the current path set.</p>
          </article>
          <article className="browse-lens-card">
            <p className="showcase-label">Path rhythm</p>
            <h3>Foundation, build, advance</h3>
            <p>Each trail creates a progression instead of a flat category index.</p>
          </article>
        </section>
      ) : null}

      {isLoading ? (
        <article className="summary-card">
          <h3>Loading paths</h3>
          <p>Preparing the current published learning trails.</p>
        </article>
      ) : error ? (
        <article className="summary-card">
          <h3>Paths unavailable</h3>
          <p>{error}</p>
        </article>
      ) : (
        <div className="card-grid featured-cards">
          {featuredPaths.map((path) => (
            <article key={path.slug} className="term-card">
              <div className="term-card-header">
                <div>
                  <p className="term-taxonomy">
                    {path.category} / {path.subCategory}
                  </p>
                  <h2>{path.title}</h2>
                </div>
              </div>
              <p>{path.description}</p>
              <div className="path-row">
                <span>{path.termCount} terms in cluster</span>
                <span>{path.featuredTermSlugs.length} featured steps</span>
              </div>
              <Link to={`/paths/${path.slug}`} className="text-link">
                Open learning trail
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
