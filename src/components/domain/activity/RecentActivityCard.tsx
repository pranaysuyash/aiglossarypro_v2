import { Link } from "react-router-dom";
import { useCatalog } from "../../../content/CatalogContext";
import { useStudy } from "../../../study/StudyContext";

export function RecentActivityCard() {
  const { termMap } = useCatalog();
  const { bookmarks, notes, lastOpenedTermSlug } = useStudy();

  const lastOpenedTerm = lastOpenedTermSlug ? termMap.get(lastOpenedTermSlug) ?? null : null;
  const latestBookmarkSlug = bookmarks.length ? bookmarks[bookmarks.length - 1] : null;
  const latestBookmark = latestBookmarkSlug ? termMap.get(latestBookmarkSlug) ?? null : null;
  const latestNoteSlug = Object.entries(notes)
    .reverse()
    .find(([, value]) => value.trim())?.[0] ?? null;
  const latestNote = latestNoteSlug ? termMap.get(latestNoteSlug) ?? null : null;
  const latestNoteSnippet = latestNoteSlug ? notes[latestNoteSlug].trim().replace(/\s+/g, " ") : "";

  return (
    <article className="recent-activity-card">
      <p className="showcase-label">Recent activity</p>
      <h3>
        {lastOpenedTerm ? `You were last studying ${lastOpenedTerm.title}` : "Your study trail is ready"}
      </h3>
      <p>
        The app remembers the last concept you opened and keeps your recent study actions close so
        it feels like a living learning membership.
      </p>
      <div className="activity-grid">
        <div>
          <span className="memory-kicker">Resume</span>
          <strong>{lastOpenedTerm ? lastOpenedTerm.title : "Open a term"}</strong>
          <span>
            {lastOpenedTerm
              ? `Jump back into ${lastOpenedTerm.taxonomy.category || "the corpus"}`
              : "Your next opened term will appear here."}
          </span>
        </div>
        <div>
          <span className="memory-kicker">Last bookmark</span>
          <strong>{latestBookmark ? latestBookmark.title : "No bookmark yet"}</strong>
          <span>{latestBookmark ? latestBookmark.taxonomy.category : "Save a term to build momentum."}</span>
        </div>
        <div>
          <span className="memory-kicker">Latest note</span>
          <strong>{latestNote ? latestNote.title : "No note yet"}</strong>
          <span>{latestNoteSnippet ? latestNoteSnippet.slice(0, 96) : "Write a note to capture your own explanation."}</span>
        </div>
      </div>
      <div className="hero-actions">
        <Link className="primary-button" to={lastOpenedTerm ? `/term/${lastOpenedTerm.slug}` : "/explore"}>
          {lastOpenedTerm ? "Resume term" : "Start exploring"}
        </Link>
        <Link className="ghost-button" to="/notes">
          Open notes
        </Link>
      </div>
    </article>
  );
}
