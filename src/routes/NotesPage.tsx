import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const { noteSlugs, notedTerms } = useMemo(() => {
    const slugs: string[] = [];
    const slugSet = new Set<string>();

    for (const [slug, value] of Object.entries(notes)) {
      if (value.trim()) {
        slugs.push(slug);
        slugSet.add(slug);
      }
    }

    return {
      noteSlugs: slugs,
      notedTerms: terms.filter((term) => slugSet.has(term.slug)),
    };
  }, [notes, terms]);
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
          <div className="flex flex-wrap gap-2">
            <Badge variant="metric">Average {notebook.averageWords} words</Badge>
            <Badge variant="metric">{isRemoteBacked ? "Account-backed" : "Browser-backed"}</Badge>
            <Badge variant="metric">{strongestNote ? `${strongestNote.wordCount}-word longest note` : "No notes yet"}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="chip">{notebookTierBreakdown.featured} featured notes</Badge>
            <Badge variant="chip">{notebookTierBreakdown.standard} standard notes</Badge>
            <Badge variant="chip">{notebookTierBreakdown.sparse} sparse notes</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="chip">{notebookInteractiveMix.quizzes} quizzes</Badge>
            <Badge variant="chip">{notebookInteractiveMix.diagrams} diagrams</Badge>
            <Badge variant="chip">{notebookInteractiveMix.faqs} FAQs</Badge>
            <Badge variant="chip">{notebookInteractiveMix.comparisons} comparisons</Badge>
            <Badge variant="chip">{notebookInteractiveMix.deepDives} deep dives</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="chip">Term packet ready</Badge>
            <Badge variant="chip">Path packet ready</Badge>
            <Badge variant="chip">Notebook export ready</Badge>
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
          <div className="flex flex-wrap gap-2">
            {notebook.denseNotes.length ? (
              notebook.denseNotes.slice(0, 3).map((note) => <Badge key={note.slug} variant="metric">{note.title}</Badge>)
            ) : (
              <Badge variant="metric">Write a note to start the study loop.</Badge>
            )}
          </div>
          <div className="hero-actions">
            <Button variant="accent" size="md" onClick={() => {
              exportStudyData();
            }}>
              Export notebook
            </Button>
            <Button variant="raised" size="md" asChild><Link to="/saved">
              Review saved shelf
            </Link></Button>
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
              <article key={slug} className="note-preview-card" style={{ contentVisibility: "auto", containIntrinsicSize: "0 120px" }}>
                <p className="showcase-label">Working note</p>
                <h3>{title}</h3>
                <p>{excerpt}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="chip">{wordCount} words</Badge>
                </div>
                <Button variant="link" asChild><Link to={`/term/${slug}`}>
                  Open note
                </Link></Button>
              </article>
            ))}
          </section>
          {notedTerms.map((term) => (
              <article key={term.slug} className="note-card" style={{ contentVisibility: "auto", containIntrinsicSize: "0 120px" }}>
                <div className="term-card-header">
                  <div>
                    <p className="term-taxonomy">
                      {term.taxonomy.category} / {term.taxonomy.subCategory}
                    </p>
                    <h3>{term.title}</h3>
                  </div>
                   <Button variant="raised" size="md" asChild><Link to={`/term/${term.slug}`}>
                    Continue note
                  </Link></Button>
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
