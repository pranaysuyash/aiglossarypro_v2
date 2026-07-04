import { Link } from "react-router-dom";
import { useMemo } from "react";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { StudyRichText } from "../components/ai-elements/StudyRichText";
import { useCatalog } from "../content/CatalogContext";
import { useStudy } from "../study/StudyContext";
import {
  buildEditorialTierBreakdown,
  buildInteractiveContentMix,
  buildNotebookSummary,
} from "../study/workspaceInsights";

export function NotesPage() {
  const { terms, isLoading, error } = useCatalog();
  const { notes, isRemoteBacked, exportStudyData } = useStudy();
  const notebook = buildNotebookSummary(terms, notes);
  const noteSlugs = useMemo(() => {
    const slugs: string[] = [];

    for (const [slug, value] of Object.entries(notes)) {
      if (value.trim()) {
        slugs.push(slug);
      }
    }

    return slugs;
  }, [notes]);
  const noteSlugSet = useMemo(() => new Set(noteSlugs), [noteSlugs]);
  const notedTerms = useMemo(
    () => terms.filter((term) => noteSlugSet.has(term.slug)),
    [noteSlugSet, terms],
  );
  const notebookTierBreakdown = buildEditorialTierBreakdown(terms, noteSlugs);
  const notebookInteractiveMix = buildInteractiveContentMix(terms, noteSlugs);
  const recentNotes = [...notebook.denseNotes].slice(0, 6);
  const strongestNote = notebook.longestNote;

  return (
    <DirectionalTransition>
    <section className="page-grid">
      <div className="section-header">
        <p className="eyebrow">Study notebook</p>
        <h2>Write the version of the idea you actually want to keep.</h2>
        <p>
          {isRemoteBacked
            ? "Every term note is now flowing through the active-membership study API boundary."
            : "Every term supports private notes already, and these will move to account sync when an active membership is attached."}
        </p>
      </div>
      <section className="workspace-hero">
        <article className="summary-card summary-emphasis">
          <p className="showcase-label">Notebook depth</p>
          <h3>
            {notebook.noteCount} notes, {notebook.totalWords} words
          </h3>
          <p>
            Use this page like a study ledger, not a dumping ground. Keep only what helps you think better later.
          </p>
          <div className="note-snippet-list">
            <span>Average {notebook.averageWords} words</span>
            <span>{isRemoteBacked ? "Account-backed" : "Browser-backed"}</span>
            <span>{strongestNote ? `${strongestNote.wordCount}-word longest note` : "No notes yet"}</span>
          </div>
          <div className="path-row">
            <span>{notebookTierBreakdown.featured} featured notes</span>
            <span>{notebookTierBreakdown.standard} standard notes</span>
            <span>{notebookTierBreakdown.sparse} sparse notes</span>
          </div>
          <div className="path-row">
            <span>{notebookInteractiveMix.quizzes} quizzes</span>
            <span>{notebookInteractiveMix.diagrams} diagrams</span>
            <span>{notebookInteractiveMix.faqs} FAQs</span>
            <span>{notebookInteractiveMix.comparisons} comparisons</span>
            <span>{notebookInteractiveMix.deepDives} deep dives</span>
          </div>
          <div className="path-row">
            <span>Term packet ready</span>
            <span>Path packet ready</span>
            <span>Notebook export ready</span>
          </div>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Best next read</p>
          <h3>{strongestNote ? strongestNote.title : "Start with a first note"}</h3>
          <p>
            {strongestNote
              ? `Your deepest note is already ${strongestNote.wordCount} words long. Revisit it when you want to sharpen the idea.`
              : "Open any term and write the first interpretation so the notebook has a memory to build on."}
          </p>
          <div className="note-snippet-list">
            {notebook.denseNotes.length ? (
              notebook.denseNotes.slice(0, 3).map((note) => <span key={note.slug}>{note.title}</span>)
            ) : (
              <span>Write a note to start the study loop.</span>
            )}
          </div>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => {
                exportStudyData();
              }}
              type="button"
            >
              Export notebook
            </button>
            <Link className="ghost-button" to="/saved">
              Review saved shelf
            </Link>
          </div>
          <p className="term-metrics">
            The notebook export works alongside the term and path study packets, so the learner can carry the whole study system forward in JSON form.
          </p>
          <p className="term-metrics">
            {notebookTierBreakdown.featured
              ? `Your notebook already contains ${notebookTierBreakdown.featured} featured-term notes.`
              : "As you annotate featured concepts, the notebook will start showing deeper entries here."}
          </p>
          <p className="term-metrics">
            {notebookInteractiveMix.quizzes
              ? `Your notes are touching ${notebookInteractiveMix.quizzes} quizzes and ${notebookInteractiveMix.diagrams} diagrams across the saved corpus.`
              : "As you annotate more terms, the notebook will reflect the interactive study mix behind those entries."}
          </p>
        </article>
      </section>
      {isLoading ? (
        <article className="summary-card">
          <h3>Loading your notebook…</h3>
          <p>Resolving notes against the current published catalog.</p>
        </article>
      ) : error ? (
        <article className="summary-card">
          <h3>Notebook syncing</h3>
          <p>{error}</p>
        </article>
      ) : notebook.noteCount ? (
        <div className="notes-column">
          <section className="note-preview-grid">
            {recentNotes.map(({ slug, title, excerpt, wordCount }) => (
              <article key={slug} className="note-preview-card">
                <p className="showcase-label">Working note</p>
                <h3>{title}</h3>
                <p>{excerpt}</p>
                <div className="path-row">
                  <span>{wordCount} words</span>
                </div>
                <Link className="text-link" to={`/term/${slug}`}>
                  Open note
                </Link>
              </article>
            ))}
          </section>
          {notedTerms.map((term) => (
              <article key={term.slug} className="note-card">
                <div className="term-card-header">
                  <div>
                    <p className="term-taxonomy">
                      {term.taxonomy.category} / {term.taxonomy.subCategory}
                    </p>
                    <h3>{term.title}</h3>
                  </div>
                  <Link className="ghost-button" to={`/term/${term.slug}`}>
                    Continue note
                  </Link>
                </div>
                <StudyRichText>{notes[term.slug]}</StudyRichText>
              </article>
            ))}
        </div>
      ) : (
        <article className="summary-card">
          <h3>No notes yet</h3>
          <p>Write a note on a term page to see your study memory accumulate here.</p>
        </article>
      )}
    </section>
    </DirectionalTransition>
  );
}
