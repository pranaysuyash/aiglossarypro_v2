import { Link } from "react-router-dom";
import { useCatalog } from "../content/CatalogContext";
import { useStudy } from "../study/StudyContext";
import {
  buildInteractiveContentMix,
  buildNotebookSummary,
  buildSavedShelfSummaries,
} from "../study/workspaceInsights";

export function StudyMemoryCard() {
  const { terms } = useCatalog();
  const { bookmarks, notes, exportStudyData } = useStudy();

  const savedShelves = buildSavedShelfSummaries(terms, bookmarks);
  const notebook = buildNotebookSummary(terms, notes);
  const interactiveMix = buildInteractiveContentMix(
    terms,
    [...new Set([...bookmarks, ...Object.keys(notes).filter((slug) => (notes[slug] ?? "").trim())])],
  );
  const primaryShelf = savedShelves[0] ?? null;
  const strongestNote = notebook.longestNote;

  return (
    <article className="study-memory-card">
      <p className="showcase-label">Study memory</p>
      <h3>
        {savedShelves.length} shelves, {notebook.noteCount} notes
      </h3>
      <p>
        This is the part that turns the app into a paid learning system: what you save, what you
        annotate, and what you can export all come back with you.
      </p>
      <div className="memory-grid">
        <div>
          <strong>{bookmarks.length}</strong>
          <span>bookmarked terms</span>
        </div>
        <div>
          <strong>{notebook.totalWords}</strong>
          <span>note words</span>
        </div>
        <div>
          <strong>{savedShelves.length}</strong>
          <span>shelves</span>
        </div>
      </div>
      <div className="memory-grid">
        <div>
          <strong>{interactiveMix.quizzes}</strong>
          <span>quizzes</span>
        </div>
        <div>
          <strong>{interactiveMix.diagrams}</strong>
          <span>diagrams</span>
        </div>
        <div>
          <strong>{interactiveMix.deepDives}</strong>
          <span>deep dives</span>
        </div>
      </div>
      <div className="memory-callouts">
        <div className="memory-callout">
          <span className="memory-kicker">Primary shelf</span>
          <strong>{primaryShelf ? primaryShelf.category : "Build your first shelf"}</strong>
          <span>
            {primaryShelf
              ? `${primaryShelf.count} terms collected in this cluster`
              : "Bookmark a term to start your learning shelf."}
          </span>
        </div>
        <div className="memory-callout">
          <span className="memory-kicker">Deepest note</span>
          <strong>{strongestNote ? strongestNote.title : "No note yet"}</strong>
          <span>
            {strongestNote
              ? `${strongestNote.wordCount} words already captured`
              : "Open a term and write your first interpretation."}
          </span>
        </div>
      </div>
      <div className="hero-actions">
        <Link className="ghost-button" to="/saved">
          Open shelf
        </Link>
        <Link className="ghost-button" to="/notes">
          Open notebook
        </Link>
        <button className="primary-button" onClick={exportStudyData} type="button">
          Export memory
        </button>
      </div>
    </article>
  );
}
