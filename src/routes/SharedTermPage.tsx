import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TermBlockRenderer } from "../components/TermBlockRenderer";
import { useCatalog } from "../content/CatalogContext";
import type { SharedResourceRecord, TermRecord } from "../types";
import { fetchSharedResource } from "../study/workspaceApi";

export function SharedTermPage() {
  const { token = "" } = useParams();
  const { loadTerm, termMap, isLoading, error } = useCatalog();
  const [shared, setShared] = useState<SharedResourceRecord | null>(null);
  const [term, setTerm] = useState<TermRecord | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(true);

  const termSummary = useMemo(() => {
    if (!shared || shared.resourceType !== "term") {
      return null;
    }
    return termMap.get(shared.resourceId) ?? null;
  }, [shared, termMap]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSharedTerm() {
      setIsShareLoading(true);
      setShareError(null);

      try {
        const share = await fetchSharedResource(token);
        if (share.resourceType !== "term") {
          throw new Error(`Unsupported shared resource type: ${share.resourceType}`);
        }
        const payload = await loadTerm(share.resourceId);
        if (!payload) {
          throw new Error("This shared term is no longer present in the current published catalog.");
        }
        if (!isCancelled) {
          setShared(share);
          setTerm(payload);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setShared(null);
          setTerm(null);
          setShareError(loadError instanceof Error ? loadError.message : "Shared term load failed");
        }
      } finally {
        if (!isCancelled) {
          setIsShareLoading(false);
        }
      }
    }

    if (!token.trim()) {
      setShareError("A share token is required.");
      setIsShareLoading(false);
      return;
    }

    void loadSharedTerm();

    return () => {
      isCancelled = true;
    };
  }, [loadTerm, token]);

  if (isLoading || isShareLoading) {
    return (
      <section className="page-grid">
        <h2>Opening shared term</h2>
        <p>Resolving the shared token and loading the published term artifact.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-grid">
        <h2>Library syncing</h2>
        <p>{error}</p>
        <Link className="text-link" to="/explore">
          Back to explore
        </Link>
      </section>
    );
  }

  if (shareError || !shared || !term) {
    return (
      <section className="page-grid">
        <h2>Share preview unavailable</h2>
        <p>{shareError ?? "This share link could not be resolved."}</p>
        <Link className="text-link" to="/explore">
          Browse the glossary
        </Link>
      </section>
    );
  }

  const currentSummary = termSummary ?? term;

  return (
    <section className="page-grid">
      <article className="hero-card term-hero">
        <div className="term-hero-copy">
          <p className="eyebrow">
            Shared term / {currentSummary.taxonomy.topic} / {currentSummary.taxonomy.category}
          </p>
          <h2>{term.title}</h2>
          <p className="term-hero-intro">
            A lightweight preview for sharing and discovery. The full study experience opens on the
            canonical term page once you want notes, bookmarks, and annotations attached to your account.
          </p>
          <p>{term.summary}</p>
          <div className="hero-actions">
            <Link className="primary-button" to={`/term/${term.slug}`}>
              Open full study page
            </Link>
            <Link className="ghost-button" to="/signup">
              Create account
            </Link>
          </div>
        </div>
        <div className="term-hero-rail">
          <article className="term-signal-card">
            <p className="showcase-label">Shared access</p>
            <h3>{shared.visibility}</h3>
            <p>{shared.expiresAt ? `Expires ${shared.expiresAt}` : "No expiry configured"}</p>
            <div className="term-tier-row">
              <span className={`term-tier term-tier-${term.metadata.editorialTier ?? "standard"}`}>
                {term.metadata.editorialTier ?? "standard"}
              </span>
            </div>
          </article>
          <article className="term-signal-card">
            <p className="showcase-label">Study links</p>
            <div className="connection-pills">
              {[
                ...term.links.prerequisites.map((label) => `Prerequisite: ${label}`),
                ...term.links.related.map((label) => `Related: ${label}`),
                ...term.links.next.map((label) => `Next: ${label}`),
              ]
                .slice(0, 6)
                .map((label) => (
                  <span key={label}>{label}</span>
                ))}
            </div>
          </article>
        </div>
      </article>

      <section className="summary-card">
        <p className="showcase-label">Shared preview</p>
        <h3>Open the concept before you commit to the whole study system.</h3>
        <p>
          Shared links now resolve through the app instead of collapsing to a dead token. The full
          note, bookmark, annotation, and export workflow remains account-bound on the primary term
          page.
        </p>
        <p className="term-metrics">
          {term.metadata.editorialTier === "featured"
            ? "This is a featured deep dive, so the canonical page will open richer study blocks and deeper memory tools."
            : "The canonical page adds the study workspace, while the preview stays lightweight for sharing."}
        </p>
      </section>

      <section className="summary-card summary-emphasis">
        <p className="showcase-label">What you can do next</p>
        <h3>Turn this preview into a real study packet.</h3>
        <p>
          Copy the shared link to send the concept to someone else, or open the canonical page to
          attach bookmarks, private notes, annotations, and a downloadable term packet.
        </p>
        <div className="path-row">
          <span>Preview is public</span>
          <span>Study packet is private</span>
          <span>Export stays JSON-first</span>
        </div>
      </section>

      <div className="detail-grid">
        <div className="content-column">
          {term.blocks.map((block) => (
            <TermBlockRenderer key={block.id} block={block} />
          ))}
        </div>
        <aside className="study-column">
          <section className="term-block">
            <p className="showcase-label">Continue learning</p>
            <h3>Turn this shared concept into your own study trail.</h3>
            <p>
              Create an account to save bookmarks, keep private notes, attach annotations, and sync
              your study memory across devices.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to="/pricing">
                View plans
              </Link>
              <Link className="ghost-button" to={`/term/${term.slug}`}>
                Go to canonical term page
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
