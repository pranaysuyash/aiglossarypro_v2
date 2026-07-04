import { memo } from "react";
import { Link } from "react-router-dom";
import { ViewTransition } from "react";
import type { TermSummary } from "../../../types";
import { useStudy } from "../../../study/StudyContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
            <Badge variant="outline">{term.metadata.editorialTier ?? "standard"}</Badge>
          </div>
        </div>
        <Button variant="raised" size="sm" onClick={() => void toggleBookmark(term.slug)}>
          {isSaved ? "Saved" : "Save term"}
        </Button>
      </div>
      <p>{term.summary}</p>
      <div className="term-card-meta-row">
        <span>{term.aliases.length} aliases</span>
        <span>{term.metadata.studyFamily ?? "No family"}</span>
        <span>Shard {term.artifact.shardId}</span>
      </div>
      <Button variant="link" asChild>
        <Link to={`/term/${term.slug}`}>Open term</Link>
      </Button>
    </article>
  );
});
