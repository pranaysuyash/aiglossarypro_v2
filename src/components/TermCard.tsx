import { Link } from "react-router-dom";
import type { TermSummary } from "../types";
import { useStudy } from "../study/StudyContext";

export function TermCard({ term }: { term: TermSummary }) {
  const { bookmarks, toggleBookmark } = useStudy();
  const isSaved = bookmarks.includes(term.slug);

  return (
    <article className="term-card">
      <div className="term-card-header">
        <div>
          <p className="term-taxonomy">
            {term.taxonomy.category} / {term.taxonomy.subCategory}
          </p>
          <h2>{term.title}</h2>
          <div className="term-tier-row">
            <span className={`term-tier term-tier-${term.metadata.editorialTier ?? "standard"}`}>
              {term.metadata.editorialTier ?? "standard"}
            </span>
          </div>
        </div>
        <button
          className="ghost-button"
          onClick={() => {
            void toggleBookmark(term.slug);
          }}
          type="button"
        >
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
      <p>{term.summary}</p>
      <Link to={`/term/${term.slug}`} className="text-link">
        Open term
      </Link>
    </article>
  );
}
