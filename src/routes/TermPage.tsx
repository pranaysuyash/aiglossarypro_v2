import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StudyRichText } from "../components/StudyRichText";
import { TermBlockRenderer } from "../components/TermBlockRenderer";
import { useCatalog } from "../content/CatalogContext";
import type { AnnotationRecord } from "../types";
import { useWorkerRequest } from "../platform/workerApi";
import { useStudy } from "../study/StudyContext";
import { createRemoteShareLink, fetchAnnotations, removeAnnotation, saveAnnotation } from "../study/workspaceApi";
import { buildFamilyHighlights, familySlug, isFamilyMatch } from "./familyHighlights";

export function TermPage() {
  const { slug = "" } = useParams();
  const { termMap, terms, isLoading, error, loadTerm } = useCatalog();
  const termSummary = useMemo(() => termMap.get(slug), [slug, termMap]);
  const { bookmarks, toggleBookmark, notes, setNote, isRemoteBacked, markTermOpened } = useStudy();
  const apiRequest = useWorkerRequest();
  const [term, setTerm] = useState<null | Awaited<ReturnType<typeof loadTerm>>>(null);
  const [termError, setTermError] = useState<string | null>(null);
  const [isTermLoading, setIsTermLoading] = useState(true);
  const [annotations, setAnnotations] = useState<AnnotationRecord[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [annotationNote, setAnnotationNote] = useState("");
  const [annotationQuote, setAnnotationQuote] = useState("");
  const [selectionCapture, setSelectionCapture] = useState<{ blockId: string; text: string } | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    function captureSelection() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setSelectionCapture(null);
        return;
      }

      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const startNode = range.startContainer;
      const endNode = range.endContainer;
      const startElement = startNode instanceof Element ? startNode : startNode.parentElement;
      const endElement = endNode instanceof Element ? endNode : endNode.parentElement;
      const startBlock = startElement?.closest<HTMLElement>("[data-block-id]");
      const endBlock = endElement?.closest<HTMLElement>("[data-block-id]");

      if (!text || !startBlock || !endBlock || startBlock.dataset.blockId !== endBlock.dataset.blockId) {
        setSelectionCapture(null);
        return;
      }

      const blockId = startBlock.dataset.blockId;
      if (!blockId) {
        setSelectionCapture(null);
        return;
      }

      setSelectionCapture({ blockId, text });
    }

    document.addEventListener("selectionchange", captureSelection);
    return () => {
      document.removeEventListener("selectionchange", captureSelection);
    };
  }, []);

  useEffect(() => {
    const activeTerm = term;

    if (!activeTerm || !isRemoteBacked) {
      setAnnotations([]);
      setSelectedBlockId(activeTerm?.blocks[0]?.id ?? "");
      return;
    }

    const activeTermSlug = activeTerm.slug;
    const defaultBlockId = activeTerm.blocks[0]?.id ?? "";

    let isCancelled = false;

    async function loadAnnotations() {
      try {
        const rows = await fetchAnnotations(activeTermSlug, apiRequest);
        if (!isCancelled) {
          setAnnotations(rows);
          setSelectedBlockId(defaultBlockId);
        }
      } catch {
        if (!isCancelled) {
          setAnnotations([]);
        }
      }
    }

    void loadAnnotations();

    return () => {
      isCancelled = true;
    };
  }, [apiRequest, isRemoteBacked, term]);

  useEffect(() => {
    let isCancelled = false;

    async function loadCurrentTerm() {
      setIsTermLoading(true);
      setTermError(null);
      try {
        const payload = await loadTerm(slug);
        if (!isCancelled) {
          setTerm(payload);
          if (!payload) {
            setTermError("This slug is not present in the current published catalog manifest.");
          } else {
            markTermOpened(payload.slug);
          }
        }
      } catch (loadError) {
        if (!isCancelled) {
          setTerm(null);
          setTermError(loadError instanceof Error ? loadError.message : "Term load failed");
        }
      } finally {
        if (!isCancelled) {
          setIsTermLoading(false);
        }
      }
    }

    void loadCurrentTerm();

    return () => {
      isCancelled = true;
    };
  }, [loadTerm, markTermOpened, slug]);

  const currentTerm = term;
  const termTitleToSlug = useMemo(
    () =>
      new Map(
        terms.flatMap((item) =>
          [item.title, ...item.aliases]
            .map((label) => label.trim().toLowerCase())
            .filter((label) => Boolean(label))
            .map((label) => [label, item.slug]),
        ),
      ),
    [terms],
  );
  const resolveTermSlug = (value: string) => termTitleToSlug.get(value.trim().toLowerCase()) ?? null;
  const studyLoop = [
    "Read the definition",
    "Bookmark the term",
    "Annotate a block",
    "Share or export the result",
  ];
  const firstLinks = currentTerm
    ? [
        ...currentTerm.links.prerequisites.map((label) => ({ kind: "Prerequisite", label, slug: resolveTermSlug(label) })),
        ...currentTerm.links.related.map((label) => ({ kind: "Related", label, slug: resolveTermSlug(label) })),
        ...currentTerm.links.next.map((label) => ({ kind: "Next", label, slug: resolveTermSlug(label) })),
      ].slice(0, 6)
    : [];
  const familyHighlights = useMemo(() => buildFamilyHighlights(terms), [terms]);
  const studyFamilySlug = currentTerm
    ? currentTerm.metadata.studyFamily
      ? familySlug(currentTerm.metadata.studyFamily)
      : familySlug(currentTerm.taxonomy.category)
    : "";
  const familyLane = useMemo(
    () => (currentTerm ? familyHighlights.find((family) => familySlug(family.title) === studyFamilySlug) ?? null : null),
    [currentTerm, familyHighlights, studyFamilySlug],
  );
  const familyLaneTerms = useMemo(
    () =>
      familyLane
        ? terms
            .filter((candidate) => isFamilyMatch(candidate, familyLane.title))
            .sort((left, right) => {
              const leftScore =
                left.metadata.editorialTier === "featured"
                  ? 3
                  : left.metadata.editorialTier === "standard"
                    ? 2
                    : 1;
              const rightScore =
                right.metadata.editorialTier === "featured"
                  ? 3
                  : right.metadata.editorialTier === "standard"
                    ? 2
                    : 1;
              if (rightScore !== leftScore) {
                return rightScore - leftScore;
              }
              return left.title.localeCompare(right.title);
            })
        : [],
    [familyLane, terms],
  );
  const familyLaneIndex = currentTerm ? familyLaneTerms.findIndex((item) => item.slug === currentTerm.slug) : -1;
  const previousFamilyTerm = familyLaneIndex > 0 ? familyLaneTerms[familyLaneIndex - 1] : null;
  const nextFamilyTerm =
    familyLaneIndex >= 0 && familyLaneIndex < familyLaneTerms.length - 1 ? familyLaneTerms[familyLaneIndex + 1] : null;

  if (isLoading || isTermLoading) {
    return (
      <section className="page-grid">
        <h2>Loading term</h2>
        <p>Reading the published catalog manifest and term detail artifact.</p>
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

  if (termError || !term) {
    return (
      <section className="page-grid">
        <h2>Term not found</h2>
        <p>{termError ?? "This slug is not present in the current published catalog manifest."}</p>
        <Link className="text-link" to="/explore">
          Back to explore
        </Link>
      </section>
    );
  }

  const activeTerm = term;
  const note = notes[activeTerm.slug] ?? "";
  const isSaved = bookmarks.includes(activeTerm.slug);
  const blockTypeSummary = activeTerm.blocks.reduce<Record<string, number>>((accumulator, block) => {
    accumulator[block.type] = (accumulator[block.type] ?? 0) + 1;
    return accumulator;
  }, {});
  const studyShortcuts = [
    { id: "at-a-glance", label: "At a glance" },
    { id: "concept-map", label: "Concept map" },
    { id: "quick-faq", label: "Quick FAQ" },
    { id: "comparison", label: "Comparison view" },
    { id: "quick-quiz", label: "Quick quiz" },
    { id: "deep-dive", label: "Featured deep dive" },
    { id: "source-definition", label: "Source snippet" },
  ].filter((shortcut) => activeTerm.blocks.some((block) => block.id === shortcut.id));
  const source = activeTerm.source.glossaryWorkbook;
  const sourceTraceItems = [
    `Workbook: ${source.file} / ${source.sheetName}`,
    `Inventory rows: ${source.inventoryRows.join(", ")}`,
    source.inventoryColumns.length ? `Inventory columns: ${source.inventoryColumns.join(", ")}` : "Inventory columns: none",
    source.taxonomyRow ? `Taxonomy row: ${source.taxonomyRow}` : "Taxonomy row: not present",
    source.definitionRow ? `Definition row: ${source.definitionRow}` : "Definition row: not present",
  ];
  async function copyShareLink() {
    if (isRemoteBacked) {
      const shareLink = await createRemoteShareLink(
        {
          resourceType: "term",
          resourceId: activeTerm.slug,
          visibility: "unlisted",
        },
        apiRequest,
      );
      const url = `${window.location.origin}/shared/${shareLink.token}`;
      await navigator.clipboard.writeText(url);
      setShareMessage("Remote share link copied.");
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    setShareMessage("Canonical term link copied.");
  }

  async function exportTermPacket() {
    const packet = {
      exportedAt: new Date().toISOString(),
      term: currentTerm,
      studyContext: {
        note,
        bookmarked: isSaved,
        annotations: annotations.map((annotation) => ({
          id: annotation.id,
          blockId: annotation.blockId,
          noteBody: annotation.noteBody,
          selectedText: annotation.selectedText,
          createdAt: annotation.createdAt,
          updatedAt: annotation.updatedAt,
        })),
      },
      sourceTrace: sourceTraceItems,
    };

    const blob = new Blob([JSON.stringify(packet, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeTerm.slug}-study-packet.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setShareMessage("Term study packet exported.");
  }

  async function createAnnotation() {
    const effectiveBlockId = selectionCapture?.blockId || selectedBlockId;
    const effectiveQuote = annotationQuote.trim() || selectionCapture?.text || "";

    if (!effectiveBlockId || !annotationNote.trim()) {
      return;
    }

    const annotationId = await saveAnnotation(
      {
        termSlug: activeTerm.slug,
        blockId: effectiveBlockId,
        selectedText: effectiveQuote || null,
        noteBody: annotationNote.trim(),
      },
      apiRequest,
    );

    setAnnotations((current) => [
      {
        id: annotationId,
        termSlug: activeTerm.slug,
        blockId: effectiveBlockId,
        startOffset: null,
        endOffset: null,
        selectedText: effectiveQuote || null,
        noteId: `${annotationId}:note`,
        noteBody: annotationNote.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...current.filter((item) => item.id !== annotationId),
    ]);
    setAnnotationNote("");
    setAnnotationQuote("");
    setSelectionCapture(null);
  }

  return (
    <section className="page-grid">
      <article className="hero-card term-hero">
        <div className="term-hero-copy">
          <p className="eyebrow">
            {(termSummary?.taxonomy.topic ?? activeTerm.taxonomy.topic)} / {activeTerm.taxonomy.category} / {activeTerm.taxonomy.subCategory}
          </p>
          <h2>{activeTerm.title}</h2>
          <p className="term-hero-intro">
            A focused entry in the field guide. Read the short version first, then stay for the
            concept graph, your own notes, and the deeper study blocks below.
          </p>
          <div className="term-tier-row">
            <span className={`term-tier term-tier-${activeTerm.metadata.editorialTier ?? "standard"}`}>
              {activeTerm.metadata.editorialTier ?? "standard"}
            </span>
          </div>
          <p>{activeTerm.summary}</p>
          <div className="shelf-links term-metrics">
            <span>{activeTerm.blocks.length} learning blocks</span>
            <span>{activeTerm.aliases.length} aliases</span>
            <span>{Object.keys(blockTypeSummary).length} content shapes</span>
            {activeTerm.metadata.studyFamily ? <span>{activeTerm.metadata.studyFamily}</span> : null}
          </div>
          {familyLane ? (
            <p>
              <span className="showcase-label">Learn this through family lane:</span>{" "}
              <Link className="text-link" to={`/families/${studyFamilySlug}`}>
                {familyLane.title}
              </Link>
            </p>
          ) : null}
          {familyLane ? (
            <div className="hero-actions">
              {previousFamilyTerm ? (
                <Link className="ghost-button" to={`/term/${previousFamilyTerm.slug}`}>
                  Previous: {previousFamilyTerm.title}
                </Link>
              ) : null}
              {nextFamilyTerm ? (
                <Link className="ghost-button" to={`/term/${nextFamilyTerm.slug}`}>
                  Next: {nextFamilyTerm.title}
                </Link>
              ) : null}
            </div>
          ) : null}
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => {
                void toggleBookmark(activeTerm.slug);
              }}
              type="button"
            >
              {isSaved ? "Remove bookmark" : "Bookmark term"}
            </button>
            <button className="ghost-button" onClick={copyShareLink} type="button">
              Copy share link
            </button>
            <button className="ghost-button" onClick={exportTermPacket} type="button">
              Export term packet
            </button>
          </div>
          {studyShortcuts.length ? (
            <article className="study-shortcut-panel">
              <p className="showcase-label">Jump into study</p>
              <div className="study-shortcut-grid">
                {studyShortcuts.map((shortcut) => (
                  <a key={shortcut.id} className="study-shortcut" href={`#${shortcut.id}`}>
                    {shortcut.label}
                  </a>
                ))}
              </div>
            </article>
          ) : null}
          {shareMessage ? <p>{shareMessage}</p> : null}
        </div>
        <div className="term-hero-rail">
          <article className="term-signal-card">
            <p className="showcase-label">Difficulty</p>
            <h3>{activeTerm.metadata.difficulty}</h3>
            <p>Maturity: {activeTerm.metadata.maturity}</p>
          </article>
          <article className="term-signal-card">
            <p className="showcase-label">This term connects to</p>
            <div className="connection-pills">
              {firstLinks.length ? (
                firstLinks.map((item) =>
                  item.slug ? (
                    <Link className="connection-link" key={`${item.kind}:${item.label}`} to={`/term/${item.slug}`}>
                      {item.kind}: {item.label}
                    </Link>
                  ) : (
                    <span key={`${item.kind}:${item.label}`}>
                      {item.kind}: {item.label}
                    </span>
                  ),
                )
              ) : (
                <span>Editorial links coming next</span>
              )}
            </div>
          </article>
          <article className="term-signal-card">
            <p className="showcase-label">Aliases</p>
            <div className="connection-pills">
              {(activeTerm.aliases.length ? activeTerm.aliases : ["No aliases listed"]).map((alias) => (
                <span key={alias}>{alias}</span>
              ))}
            </div>
          </article>
          <article className="term-signal-card">
            <p className="showcase-label">Study loop</p>
            <div className="connection-pills">
              {studyLoop.map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </article>
          <article className="term-signal-card">
            <p className="showcase-label">Source trace</p>
            <div className="connection-pills">
              {sourceTraceItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        </div>
      </article>

      <section className="term-overview-grid">
        <article className="summary-card">
          <p className="showcase-label">Why it matters</p>
          <h3>Use the quick definition, then stay for the concept network.</h3>
          <p>
            This page should work like a study desk: read the explanation, attach your own
            memory, connect it to adjacent ideas, and keep moving without losing context.
          </p>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Study path</p>
          <div className="path-row">
            <span>{activeTerm.links.prerequisites.length} prerequisites</span>
            <span>{activeTerm.links.related.length} related links</span>
            <span>{activeTerm.links.next.length} next ideas</span>
          </div>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Content shape</p>
          <div className="path-row">
            {Object.entries(blockTypeSummary).map(([type, count]) => (
              <span key={type}>
                {count} {type}
              </span>
            ))}
          </div>
        </article>
        <article className="summary-card">
          <p className="showcase-label">Corpus accuracy</p>
          <h3>Source-backed and build-audited.</h3>
          <p>
            The published corpus is regenerated from the workbook snapshots and rechecked at build
            time so term pages stay traceable to the source sheet instead of drifting into sample
            content.
          </p>
        </article>
      </section>

      <div className="detail-grid">
        <div className="content-column">
          <section className="content-stack-header">
            <p className="eyebrow">Core explanation</p>
            <h3>Read the term like an entry in a living field guide.</h3>
          </section>
          <section className="study-ribbon">
            {studyLoop.map((step, index) => (
              <article key={step} className="study-ribbon-card">
                <p className="ritual-index">{String(index + 1).padStart(2, "0")}</p>
                <h3>{step}</h3>
              </article>
            ))}
          </section>
          {term.blocks.map((block) => (
            <TermBlockRenderer key={block.id} block={block} />
          ))}
        </div>
        <aside className="study-column">
          <section className="term-block study-note-card">
            <p className="showcase-label">Notebook</p>
            <h3>Keep your own explanation</h3>
            <p>
              {isRemoteBacked
                ? "Your note is backed by your active membership account."
                : "Your note is stored in the browser until an active membership is linked."}
            </p>
            <textarea
              autoComplete="off"
              value={note}
              onChange={(event) => {
                void setNote(term.slug, event.target.value);
              }}
              name="termNote"
              spellCheck={false}
              placeholder="Capture what you want to remember, compare, or revisit."
            />
            {note.trim() ? (
              <div className="study-markdown-preview">
                <p className="showcase-label">Rendered note</p>
                <StudyRichText>{note}</StudyRichText>
              </div>
            ) : null}
          </section>
          <section className="term-block">
            <p className="showcase-label">Concept map</p>
            <h3>Where this term sits</h3>
            <div className="graph-group">
              <p>
                <strong>Prerequisites:</strong> 
                <span className="path-row">
                  {term.links.prerequisites.length ? (
                    term.links.prerequisites.map((label) => {
                      const labelSlug = resolveTermSlug(label);
                      return labelSlug ? (
                        <Link className="concept-link" key={`prereq-${label}`} to={`/term/${labelSlug}`}>
                          {label}
                        </Link>
                      ) : (
                        <span key={`prereq-${label}`}>{label}</span>
                      );
                    })
                  ) : (
                    <span>None yet</span>
                  )}
                </span>
              </p>
              <p>
                <strong>Related:</strong>{" "}
                {term.links.related.length ? (
                  <span className="path-row">
                    {term.links.related.map((label) => {
                      const labelSlug = resolveTermSlug(label);
                      return labelSlug ? (
                        <Link className="concept-link" key={`related-${label}`} to={`/term/${labelSlug}`}>
                          {label}
                        </Link>
                      ) : (
                        <span key={`related-${label}`}>{label}</span>
                      );
                    })}
                  </span>
                ) : (
                  <span>None yet</span>
                )}
              </p>
              <p>
                <strong>Next:</strong>{" "}
                {term.links.next.length ? (
                  <span className="path-row">
                    {term.links.next.map((label) => {
                      const labelSlug = resolveTermSlug(label);
                      return labelSlug ? (
                        <Link className="concept-link" key={`next-${label}`} to={`/term/${labelSlug}`}>
                          {label}
                        </Link>
                      ) : (
                        <span key={`next-${label}`}>{label}</span>
                      );
                    })}
                  </span>
                ) : (
                  <span>None yet</span>
                )}
              </p>
            </div>
          </section>
          <section className="term-block">
            <p className="showcase-label">Annotations</p>
            <h3>Annotate the block that mattered</h3>
            <p>
              {isRemoteBacked
                ? "Annotations are stored through the active-member study API."
                : "Annotations become durable after a paid membership is active."}
            </p>
            {selectionCapture ? (
              <div className="annotation-selection-card">
                <p className="showcase-label">Selection ready</p>
                <p>
                  The current text selection is attached to <strong>{selectionCapture.blockId}</strong>.
                </p>
                <StudyRichText variant="compact">{selectionCapture.text}</StudyRichText>
                <div className="hero-actions">
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setSelectedBlockId(selectionCapture.blockId);
                      setAnnotationQuote(selectionCapture.text);
                    }}
                    type="button"
                  >
                    Use selected text
                  </button>
                </div>
              </div>
            ) : null}
            <label className="search-panel">
              <span>Attach to block</span>
              <select
                name="annotationBlock"
                value={selectedBlockId}
                onChange={(event) => setSelectedBlockId(event.target.value)}
              >
                {term.blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.title}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              autoComplete="off"
              value={annotationNote}
              onChange={(event) => setAnnotationNote(event.target.value)}
              name="annotationNote"
              spellCheck={false}
              placeholder="Write a focused annotation for this block."
            />
            <label className="search-panel">
              <span>Selected excerpt</span>
              <input
                autoComplete="off"
                value={annotationQuote}
                onChange={(event) => setAnnotationQuote(event.target.value)}
                name="annotationQuote"
                spellCheck={false}
                placeholder="Optional quote or exact phrase from the block"
              />
            </label>
            <div className="hero-actions">
              <button
                className="ghost-button"
                disabled={!isRemoteBacked || !annotationNote.trim()}
                onClick={() => {
                  void createAnnotation();
                }}
                type="button"
              >
                Save annotation
              </button>
            </div>
            {annotations.length ? (
              <div className="annotation-list">
                {annotations.map((annotation) => (
                  <article key={annotation.id} className="annotation-card">
                    <h3>{annotation.blockId}</h3>
                    {annotation.selectedText ? (
                      <StudyRichText className="annotation-quote" variant="compact">{`> ${annotation.selectedText}`}</StudyRichText>
                    ) : null}
                    <StudyRichText variant="compact">{annotation.noteBody ?? "Annotation saved."}</StudyRichText>
                    <button
                      className="text-link"
                      onClick={() => {
                        void removeAnnotation(annotation.id, apiRequest).then(() => {
                          setAnnotations((current) => current.filter((item) => item.id !== annotation.id));
                        });
                      }}
                      type="button"
                    >
                      Remove annotation
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </section>
  );
}
