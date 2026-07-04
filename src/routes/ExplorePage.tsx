import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TermCard } from "../components/TermCard";
import { useCatalog } from "../content/CatalogContext";

export function ExplorePage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const { terms, isLoading, error } = useCatalog();

  const filteredTerms = useMemo(() => {
    const key = deferredQuery.trim().toLowerCase();
    if (!key) {
      return terms;
    }
    return terms.filter((term) =>
      [term.title, term.summary, term.taxonomy.category, term.taxonomy.subCategory]
        .join(" ")
        .toLowerCase()
        .includes(key),
    );
  }, [deferredQuery, terms]);
  const visibleTerms = deferredQuery.trim() ? filteredTerms : filteredTerms.slice(0, 12);
  const featuredConcepts = useMemo(
    () =>
      terms
        .filter((term) => term.metadata.editorialTier === "featured")
        .slice(0, 8),
    [terms],
  );

  const featuredShelves = useMemo(() => {
    const groups = new Map<
      string,
      {
        label: string;
        note: string;
        terms: typeof terms;
      }
    >();

    for (const term of terms) {
      const key = term.taxonomy.category || "General";
      if (!groups.has(key)) {
        groups.set(key, {
          label: key,
          note: formatShelfNote(term.taxonomy.topic, term.taxonomy.category, term.taxonomy.subCategory),
          terms: [],
        });
      }
      groups.get(key)?.terms.push(term);
    }

    return Array.from(groups.values())
      .sort((left, right) => right.terms.length - left.terms.length)
      .slice(0, 4)
      .map((group) => ({
        ...group,
        terms: group.terms.slice(0, 3),
      }));
  }, [terms]);

  const familyShelves = useMemo(() => {
    const groups = new Map<
      string,
      {
        label: string;
        note: string;
        count: number;
        terms: typeof terms;
      }
    >();

    for (const term of terms) {
      const label = term.metadata.studyFamily || term.taxonomy.category || "Unclassified";
      if (!groups.has(label)) {
        groups.set(label, {
          label,
          note:
            label === "Unclassified"
              ? "Use the title graph and nearby concepts to keep moving."
              : `Browse the terms that cluster around ${label}.`,
          count: 0,
          terms: [],
        });
      }
      const group = groups.get(label);
      if (group) {
        group.count += 1;
        group.terms.push(term);
      }
    }

    return Array.from(groups.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, 6)
      .map((group) => ({
        ...group,
        terms: group.terms.slice(0, 4),
      }));
  }, [terms]);

  const browseLenses = useMemo(() => {
    const lenses = [
      {
        title: "By concept family",
        note: "Walk through the densest clusters that anchor the glossary.",
        body: "Transformers, optimization, evaluation, representation learning.",
      },
      {
        title: "By study motion",
        note: "Move from first read to saved memory to reusable export.",
        body: "Discover, bookmark, annotate, share, export, revisit.",
      },
      {
        title: "By reading depth",
        note: "Start with a quick summary and keep unfolding the block stack.",
        body: "Summary, concept note, list, or step-by-step breakdown.",
      },
    ];
    return lenses;
  }, []);
  return (
    <section className="page-grid">
      <div className="section-header explore-heading">
        <p className="eyebrow">Library</p>
        <h2>Search for ideas the way a learner thinks, not the way a spreadsheet stores them.</h2>
        <p>
          Start with a term, a family, a method, or a confusion you keep running into. The goal is
          to make discovery feel inviting enough for beginners and sharp enough for advanced self-study.
        </p>
      </div>
      <section className="browse-lenses">
        {browseLenses.map((lens) => (
          <article key={lens.title} className="browse-lens-card">
            <p className="showcase-label">{lens.title}</p>
            <h3>{lens.note}</h3>
            <p>{lens.body}</p>
          </article>
        ))}
      </section>
      {!isLoading && !error ? (
        <section className="featured-concepts-section">
          <div className="section-header featured-concepts-header">
            <p className="eyebrow">Featured concepts</p>
            <h2>Start with the ideas that deserve a deeper read.</h2>
            <p>
              These are the terms with enough source and graph signal to support a richer deep dive.
              They are the best on-ramp when you want the library to feel curated instead of flat.
            </p>
          </div>
          <div className="featured-concepts-grid">
            {featuredConcepts.map((term) => (
              <article key={term.slug} className="featured-concept-card">
                <div className="featured-concept-head">
                  <span className={`term-tier term-tier-${term.metadata.editorialTier ?? "standard"}`}>
                    {term.metadata.editorialTier ?? "standard"}
                  </span>
                  <p className="term-taxonomy">
                    {term.taxonomy.category} / {term.taxonomy.subCategory}
                  </p>
                </div>
                <h3>{term.title}</h3>
                <p>{term.summary}</p>
                <Link className="text-link" to={`/term/${term.slug}`}>
                  Open deep dive
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {!isLoading && !error ? (
        <section className="library-shelves">
          {familyShelves.map((shelf) => (
            <article key={shelf.label} className="library-shelf-card">
              <p className="eyebrow">{shelf.label}</p>
              <h3>{shelf.count} terms in this family</h3>
              <p>{shelf.note}</p>
              <div className="shelf-links">
                {shelf.terms.map((term) => (
                  <Link key={term.slug} className="text-link" to={`/term/${term.slug}`}>
                    {term.title}
                  </Link>
                ))}
              </div>
              <Link className="text-link" to="/families">
                Open family rail
              </Link>
            </article>
          ))}
        </section>
      ) : null}
      {!isLoading && !error ? (
        <section className="library-shelves">
          {featuredShelves.map((shelf) => (
            <article key={shelf.label} className="library-shelf-card">
              <p className="eyebrow">{shelf.label}</p>
              <h3>{shelf.note}</h3>
              <div className="shelf-links">
                {shelf.terms.map((term) => (
                  <Link key={term.slug} className="text-link" to={`/term/${term.slug}`}>
                    {term.title}
                  </Link>
                ))}
              </div>
              <Link className="text-link" to="/families">
                Open family rail
              </Link>
            </article>
          ))}
        </section>
      ) : null}
      <label className="search-panel search-panel-large">
        <span>Search the living catalog</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: transformers, evaluation metrics, active learning, reasoning..."
        />
      </label>
      {!isLoading && !error ? (
        <article className="summary-card search-status">
          <h3>{deferredQuery.trim() ? filteredTerms.length : visibleTerms.length} matching entries</h3>
          <p>
            {query.trim()
              ? `Results for "${query.trim()}"`
              : "Showing a curated slice of the current published catalog. Search to open the full index."}
          </p>
        </article>
      ) : null}
      {isLoading ? (
        <article className="summary-card">
          <h3>Loading catalog</h3>
          <p>Preparing the current published term set for search.</p>
        </article>
      ) : error ? (
        <article className="summary-card">
          <h3>Library syncing</h3>
          <p>{error}</p>
        </article>
      ) : (
        <div className="card-grid featured-cards">
          {visibleTerms.map((term) => (
            <TermCard key={term.slug} term={term} />
          ))}
        </div>
      )}
    </section>
  );
}

function formatShelfNote(topic: string, category: string, subCategory: string): string {
  const fragments = [topic, category, subCategory].filter(Boolean);
  if (!fragments.length) {
    return "General";
  }
  if (fragments.length === 1) {
    return fragments[0];
  }
  return `${fragments[0]} / ${fragments.slice(1).join(" / ")}`;
}
