import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../content/CatalogContext";
import { useStudy } from "../study/StudyContext";
import type { ExportJobRecord } from "../types";
import { useWorkerRequest } from "../platform/workerApi";
import { fetchExportJobs, requestRemoteExport } from "../study/workspaceApi";
import {
  buildEditorialTierBreakdown,
  buildInteractiveContentMix,
  buildSavedShelfSummaries,
  getLatestExportJob,
} from "../study/workspaceInsights";

const workspaceDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function SavedPage() {
  const { terms, isLoading, error } = useCatalog();
  const { bookmarks, exportStudyData, isRemoteBacked } = useStudy();
  const apiRequest = useWorkerRequest();
  const [exportJobs, setExportJobs] = useState<ExportJobRecord[]>([]);
  const bookmarkedTermSlugs = new Set(bookmarks);
  const savedTerms = terms.filter((term) => bookmarkedTermSlugs.has(term.slug));
  const savedTermLookup = new Map(savedTerms.map((term) => [term.slug, term]));
  const savedShelves = buildSavedShelfSummaries(terms, bookmarks);
  const savedTierBreakdown = buildEditorialTierBreakdown(terms, bookmarks);
  const savedInteractiveMix = buildInteractiveContentMix(terms, bookmarks);
  const latestExportJob = getLatestExportJob(exportJobs);
  const primaryShelf = savedShelves[0] ?? null;

  useEffect(() => {
    if (!isRemoteBacked) {
      setExportJobs([]);
      return;
    }

    let isCancelled = false;
    async function loadExportJobs() {
      try {
        const jobs = await fetchExportJobs(apiRequest);
        if (!isCancelled) {
          setExportJobs(jobs);
        }
      } catch {
        if (!isCancelled) {
          setExportJobs([]);
        }
      }
    }

    void loadExportJobs();
    return () => {
      isCancelled = true;
    };
  }, [apiRequest, isRemoteBacked]);

  async function exportWorkspace() {
    if (!isRemoteBacked) {
      exportStudyData();
      return;
    }

    const result = await requestRemoteExport(apiRequest);
    const blob = new Blob([JSON.stringify(result.payload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aiglossary-study-export.json";
    anchor.click();
    window.URL.revokeObjectURL(url);
    setExportJobs((current) => [result.exportJob, ...current]);
  }

  const latestExportLabel = latestExportJob
    ? `${latestExportJob.status} · ${formatWorkspaceDate(latestExportJob.requestedAt)}`
    : "No export history yet";
  const topShelfTermTitles = primaryShelf?.representativeTerms.map((term) => term.title) ?? [];

  return (
    <section className="page-grid">
      <div className="section-header">
        <p className="eyebrow">Study shelf</p>
        <h2>Keep the concepts you want to return to close at hand.</h2>
        <p>
          {isRemoteBacked
            ? "Your saved shelf is backed by your active membership and stored through D1."
            : "Your saved shelf is currently isolated to this browser session until paid membership is active."}
        </p>
      </div>
      <section className="workspace-hero">
        <article className="summary-card summary-emphasis">
          <p className="showcase-label">Study shelf</p>
          <h3>{isRemoteBacked ? "Your member shelf stays with your account." : "Your shelf starts in this browser."}</h3>
          <p>
            {isRemoteBacked
              ? "Bookmarks, notes, and exports are tied to the active membership and can be restored through the Worker-backed study state."
              : "Bookmarking and export still work locally, and the paid account layer will carry this shelf across devices once attached."}
          </p>
          <div className="note-snippet-list">
            <span>{savedTerms.length} saved terms</span>
            <span>{savedShelves.length} shelves</span>
            <span>{latestExportLabel}</span>
          </div>
          <div className="path-row">
            <span>{savedTierBreakdown.featured} featured</span>
            <span>{savedTierBreakdown.standard} standard</span>
            <span>{savedTierBreakdown.sparse} sparse</span>
          </div>
          <div className="path-row">
            <span>{savedInteractiveMix.quizzes} quizzes</span>
            <span>{savedInteractiveMix.diagrams} diagrams</span>
            <span>{savedInteractiveMix.faqs} FAQs</span>
            <span>{savedInteractiveMix.comparisons} comparisons</span>
            <span>{savedInteractiveMix.deepDives} deep dives</span>
          </div>
          <div className="path-row">
            <span>Term packets</span>
            <span>Path packets</span>
            <span>Workspace export</span>
          </div>
          <div className="hero-actions">
            <Link className="ghost-button" to="/pricing">
              Review membership
            </Link>
          </div>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Return path</p>
          <h3>
            {primaryShelf
              ? `${primaryShelf.count} terms in ${primaryShelf.category}`
              : "Build your first shelf"}
          </h3>
          <p>
            {primaryShelf
              ? "This is the cluster the learner can return to when they want to revisit a focused part of the corpus."
              : "Bookmark a few terms from explore or a term page to create a focused shelf."}
          </p>
          <div className="note-snippet-list">
            {topShelfTermTitles.length ? (
              topShelfTermTitles.map((title) => <span key={title}>{title}</span>)
            ) : (
              <span>Bookmark a few terms to build a shelf.</span>
            )}
          </div>
          <p className="term-metrics">
            {savedTierBreakdown.featured
              ? `${savedTierBreakdown.featured} of your saved terms are featured deep dives.`
              : "Featured terms will show up here once you save them."}
          </p>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Exportable memory</p>
          <h3>Export your workspace</h3>
          <p>
            Take your saved terms and notes out as structured study data whenever you want, with export history preserved when the account layer is live.
          </p>
          <p className="term-metrics">
            Export now includes the full study workspace, while individual terms and paths can also be saved as standalone JSON packets from their own pages.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => {
                void exportWorkspace();
              }}
              type="button"
            >
              Export study data
            </button>
          </div>
          <div className="path-row">
            <span>Study mix ready</span>
            <span>{savedInteractiveMix.quizzes} quizzes</span>
            <span>{savedInteractiveMix.diagrams} diagrams</span>
          </div>
          <p className="term-metrics">Last export: {latestExportLabel}</p>
        </article>
      </section>
      {isRemoteBacked && exportJobs.length ? (
        <article className="summary-card">
          <h3>Recent exports</h3>
          <ul className="export-history-list">
            {exportJobs.slice(0, 5).map((job) => (
              <li key={job.id}>
                {job.exportType} / {job.status} / {job.requestedAt}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
      {isLoading ? (
        <article className="summary-card">
          <h3>Loading your shelf…</h3>
          <p>Joining your saved slugs against the current published catalog.</p>
        </article>
      ) : error ? (
        <article className="summary-card">
          <h3>Study shelf syncing</h3>
          <p>{error}</p>
        </article>
      ) : savedTerms.length ? (
        <div className="saved-shelves">
          {savedShelves.map((shelf) => (
            <section key={shelf.category} className="saved-shelf-section">
              <div className="section-header">
                <p className="eyebrow">{shelf.category}</p>
                <h3>{shelf.count} terms saved in this shelf</h3>
              </div>
              <div className="card-grid">
                {shelf.representativeTerms.map((term) => {
                  const savedTerm = savedTermLookup.get(term.slug);
                  return (
                    <article key={term.slug} className="summary-card saved-card">
                      <p className="term-taxonomy">
                        {term.taxonomy.topic} / {term.taxonomy.subCategory}
                      </p>
                      <h3>{term.title}</h3>
                      <p>{savedTerm?.summary ?? "Saved term"}</p>
                      <Link className="text-link" to={`/term/${term.slug}`}>
                        Open term
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <article className="summary-card">
          <h3>No saved terms yet</h3>
          <p>Bookmark a term from the explore or term pages to build your study set.</p>
        </article>
      )}
    </section>
  );
}

function formatWorkspaceDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return workspaceDateFormatter.format(parsed);
}
