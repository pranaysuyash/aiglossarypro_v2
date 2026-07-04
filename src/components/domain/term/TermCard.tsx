import { memo } from "react";
import { Link } from "react-router-dom";
import { ViewTransition } from "react";
import type { TermSummary } from "../../../types";
import { useStudy } from "../../../study/StudyContext";

export const TermCard = memo(function TermCard({ term }: { term: TermSummary }) {
  const { bookmarks, toggleBookmark } = useStudy();
  const isSaved = bookmarks.includes(term.slug);

  return (
    <article className="term-card">
      <div className="term-card-header">
        <div>
          <p className="term-taxonomy">
            {term.taxonomy.category} / {term.taxonomy.subCategory}
          </p>
          <ViewTransition name={`term-title-${term.slug}`} share="text-morph" default="none">
            <h2>{term.title}</h2>
          </ViewTransition>
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
          {isSaved ? "Saved" : "Save term"}
        </button>
      </div>
      <p>{term.summary}</p>
      <div className="term-card-meta-row">
        <span>{term.aliases.length} aliases</span>
        <span>{term.metadata.studyFamily ?? "No family"}</span>
        <span>Shard {term.artifact.shardId}</span>
      </div>
      <Link to={`/term/${term.slug}`} className="text-link">
        Open term
      </Link>
    </article>
  );
});
