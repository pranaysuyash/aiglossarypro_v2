import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../../content/CatalogContext";
import { useStudy } from "../../../study/StudyContext";
import { Button } from "@/components/ui/button";

export const ContinueLearningCard = memo(function ContinueLearningCard() {
  const { termMap, paths } = useCatalog();
  const { lastOpenedTermSlug, bookmarks, notes } = useStudy();

  const lastOpenedTerm = useMemo(() => (lastOpenedTermSlug ? termMap.get(lastOpenedTermSlug) : null), [lastOpenedTermSlug, termMap]);
  const suggestedNextSlug = useMemo(
    () =>
      lastOpenedTerm?.links.next[0] ??
      lastOpenedTerm?.links.related[0] ??
      paths[0]?.featuredTermSlugs[0] ??
      null,
    [lastOpenedTerm, paths],
  );
  const suggestedNextTerm = useMemo(() => (suggestedNextSlug ? termMap.get(suggestedNextSlug) ?? null : null), [suggestedNextSlug, termMap]);
  const savedCount = bookmarks.length;
  const noteCount = useMemo(() => Object.values(notes).filter((value) => value.trim()).length, [notes]);
  const firstPath = paths[0] ?? null;

  return (
    <article className="continue-learning-card">
      <p className="showcase-label">Continue learning</p>
      <h3>{lastOpenedTerm ? lastOpenedTerm.title : "Pick up where you left off"}</h3>
      <p>
        {lastOpenedTerm
          ? `You last opened ${lastOpenedTerm.title}, so that is the fastest place to resume.`
          : "Open a term and the home surface will remember it here for the next visit."}
      </p>
      <div className="continue-grid">
        <div>
          <strong>{savedCount}</strong>
          <span>saved terms</span>
        </div>
        <div>
          <strong>{noteCount}</strong>
          <span>notes</span>
        </div>
        <div>
          <strong>{firstPath ? firstPath.termCount : 0}</strong>
          <span>terms in first path</span>
        </div>
      </div>
      <div className="memory-callouts">
        <div className="memory-callout">
          <span className="memory-kicker">Next up</span>
          <strong>{suggestedNextTerm ? suggestedNextTerm.title : "Open a term"}</strong>
          <span>
            {suggestedNextTerm
              ? suggestedNextTerm.taxonomy.category || "Suggested from the current corpus"
              : "A next concept will appear here after you open a term."}
          </span>
        </div>
      </div>
      <div className="hero-actions">
        <Button variant="accent" asChild>
          <Link to={lastOpenedTerm ? `/term/${lastOpenedTerm.slug}` : "/explore"}>
            {lastOpenedTerm ? "Resume term" : "Start exploring"}
          </Link>
        </Button>
        <Button variant="raised" asChild>
          <Link to={suggestedNextTerm ? `/term/${suggestedNextTerm.slug}` : "/paths"}>
            {suggestedNextTerm ? "Open next concept" : "Browse paths"}
          </Link>
        </Button>
        <Button variant="raised" asChild>
          <Link to="/paths">Browse paths</Link>
        </Button>
      </div>
    </article>
  );
});
