import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import {
  Bell,
  Bookmark,
  Bot,
  Boxes,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  ChevronLeft,
  FileText,
  Flame,
  HelpCircle,
  Home,
  Library,
  MessageSquarePlus,
  Network,
  NotebookTabs,
  Route,
  Save,
  Search,
  Share2,
  Sparkles,
  StickyNote,
  ThumbsDown,
  ThumbsUp,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewTransition } from "react";
import { StudyRichText } from "../components/ai-elements/StudyRichText";
import { TermBlockRenderer } from "../components/domain/term/TermBlockRenderer";
import { TermExtrasTabs } from "../components/domain/term/TermExtrasTabs";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { useCatalog } from "../content/CatalogContext";
import { getTermBlocks } from "../content/termBlocks";
import { getBlockTabKey, splitTermBlocks, type TermExtraTabKey } from "../content/termBlockGroups";
import type { AnnotationRecord } from "../types";
import { useAppState } from "../platform/AppContext";
import { useWorkerRequest } from "../platform/workerApi";
import { useStudy } from "../study/StudyContext";
import { createRemoteShareLink, fetchAnnotations, removeAnnotation, saveAnnotation } from "../study/workspaceApi";
import { computeQuizAccuracy, computeStreakDays, getDueReviews, loadActivityDates, loadQuizAttempts, recordTermOpened } from "../study/progress";
import { buildFamilyHighlights, familySlug, isFamilyMatch } from "./familyHighlights";

const sidebarItems: Array<{ label: string; to: string; icon: typeof Home; badgeKey?: "saved" | "notes" | "review" }> = [
  { label: "Home", to: "/", icon: Home },
  { label: "Paths", to: "/paths", icon: Route },
  { label: "Library", to: "/explore", icon: Library },
  { label: "Families", to: "/families", icon: Network },
  { label: "Saved", to: "/saved", icon: Bookmark, badgeKey: "saved" },
  { label: "Notes", to: "/notes", icon: StickyNote, badgeKey: "notes" },
  { label: "Review", to: "/review", icon: ClipboardCheck, badgeKey: "review" },
  { label: "Notebook", to: "/notes", icon: NotebookTabs, badgeKey: "notes" },
];

const topicShortcuts = [
  { label: "AI Fundamentals", icon: Brain },
  { label: "Machine Learning", icon: Bot },
  { label: "Deep Learning", icon: Sparkles },
  { label: "LLMs & GenAI", icon: Boxes },
  { label: "MLOps", icon: Route },
  { label: "Computer Vision", icon: Search },
] as const;

const studyShortcuts = [
  { id: "overview", label: "In simple terms" },
  { id: "why-it-matters", label: "Why it matters" },
  { id: "concept-map", label: "Concept map" },
  { id: "quick-faq", label: "Misconceptions" },
  { id: "comparison", label: "Comparison view" },
  { id: "quick-quiz", label: "Quiz your understanding" },
  { id: "deep-dive", label: "Featured deep dive" },
];

const learnerTabs = [
  { id: "overview", label: "Overview" },
  { id: "explanation", label: "Explain" },
  { id: "visuals", label: "Visuals" },
  { id: "how-it-works", label: "How it works" },
  { id: "compare", label: "Compare" },
  { id: "examples", label: "Examples" },
  { id: "quick-quiz", label: "Quiz" },
  { id: "notes", label: "Notes & Links" },
] as const;

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function estimateReadMinutes(blockCount: number, summaryLength: number): number {
  return Math.min(14, Math.max(6, Math.round(summaryLength / 120) + Math.ceil(blockCount / 2)));
}

function titleCaseLabel(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function plainDefinition(title: string, summary: string): string {
  if (title.toLowerCase() === "attention mechanism") {
    return "A mechanism that allows a model to focus on the most relevant parts of the input when producing each part of the output.";
  }
  const [firstSentence] = summary.split(/(?<=\.)\s+/);
  return firstSentence && firstSentence.length <= 220 ? firstSentence : summary;
}

function buildFurtherReading(title: string): Array<{ title: string; source: string; href: string }> {
  if (title.toLowerCase() === "attention mechanism") {
    return [
      {
        title: "Attention Is All You Need",
        source: "Vaswani et al., 2017",
        href: "https://arxiv.org/abs/1706.03762",
      },
      {
        title: "The Illustrated Transformer",
        source: "Jay Alammar",
        href: "https://jalammar.github.io/illustrated-transformer/",
      },
      {
        title: "Hugging Face - Attention",
        source: "Documentation",
        href: "https://huggingface.co/docs/transformers",
      },
    ];
  }
  return [];
}

export function TermPage() {
  const { slug = "" } = useParams();
  const { session } = useAppState();
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
  const [selectedExtraTab, setSelectedExtraTab] = useState<TermExtraTabKey | undefined>(undefined);
  const [helpfulnessVote, setHelpfulnessVote] = useState<"up" | "down" | null>(null);

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
    const activeBlocks = getTermBlocks(activeTerm);

    if (!activeTerm || !isRemoteBacked) {
      setAnnotations([]);
      setSelectedBlockId(activeBlocks[0]?.id ?? "");
      return;
    }

    const activeTermSlug = activeTerm.slug;
    const defaultBlockId = activeBlocks[0]?.id ?? "";

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
            recordTermOpened(payload.slug);
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
  const termTitleToSlug = useMemo(() => {
    const nextMap = new Map<string, string>();

    for (const item of terms) {
      for (const label of [item.title, ...item.aliases]) {
        const normalized = label.trim().toLowerCase();
        if (normalized) {
          nextMap.set(normalized, item.slug);
        }
      }
    }

    return nextMap;
  }, [terms]);

  const resolveTermSlug = useCallback((value: string) => termTitleToSlug.get(value.trim().toLowerCase()) ?? null, [termTitleToSlug]);

  const firstLinks = useMemo(
    () =>
      currentTerm
        ? [
            ...currentTerm.links.prerequisites.map((label) => ({ kind: "Prerequisite", label, slug: resolveTermSlug(label) })),
            ...currentTerm.links.related.map((label) => ({ kind: "Related", label, slug: resolveTermSlug(label) })),
            ...currentTerm.links.next.map((label) => ({ kind: "Next", label, slug: resolveTermSlug(label) })),
          ].slice(0, 6)
        : [],
    [currentTerm, resolveTermSlug],
  );

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
  const familyLaneTerms = useMemo(() => {
    if (!familyLane) {
      return [];
    }

    const matchingTerms: typeof terms = [];
    for (const candidate of terms) {
      if (isFamilyMatch(candidate, familyLane.title)) {
        matchingTerms.push(candidate);
      }
    }

    matchingTerms.sort((left, right) => {
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
    });

    return matchingTerms;
  }, [familyLane, terms]);
  const familyLaneIndex = currentTerm ? familyLaneTerms.findIndex((item) => item.slug === currentTerm.slug) : -1;
  const previousFamilyTerm = familyLaneIndex > 0 ? familyLaneTerms[familyLaneIndex - 1] : null;
  const nextFamilyTerm =
    familyLaneIndex >= 0 && familyLaneIndex < familyLaneTerms.length - 1 ? familyLaneTerms[familyLaneIndex + 1] : null;

  const activeBlocks = useMemo(() => getTermBlocks(term), [term]);
  const termBlockGroups = useMemo(() => splitTermBlocks(activeBlocks), [activeBlocks]);
  const filteredStudyShortcuts = useMemo(
    () => studyShortcuts.filter((shortcut) => activeBlocks.some((block) => block.id === shortcut.id)),
    [activeBlocks],
  );

  const { hash } = useLocation();
  const activeExtraTab = useMemo(() => {
    if (!termBlockGroups.extras.length || !hash) {
      return selectedExtraTab;
    }

    const blockId = decodeURIComponent(hash.slice(1));
    const tabKey = getBlockTabKey(blockId);
    if (!tabKey || !termBlockGroups.extras.some((tab) => tab.key === tabKey)) {
      return selectedExtraTab;
    }

    return selectedExtraTab ?? tabKey;
  }, [hash, selectedExtraTab, termBlockGroups.extras]);

  useEffect(() => {
    if (!termBlockGroups.extras.length || !hash) {
      return;
    }

    const blockId = decodeURIComponent(hash.slice(1));
    const tabKey = getBlockTabKey(blockId);
    if (!tabKey || !termBlockGroups.extras.some((tab) => tab.key === tabKey)) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(blockId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [hash, termBlockGroups.extras]);

  if (isLoading || isTermLoading) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Loading term…</h2>
        <p>Reading the published catalog manifest and term detail artifact.</p>
      </section>
      </DirectionalTransition>
    );
  }

  if (error) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Library syncing</h2>
        <p>{error}</p>
        <Button variant="link" asChild><Link to="/explore">
          Back to explore
        </Link></Button>
      </section>
      </DirectionalTransition>
    );
  }

  if (termError || !term) {
    return (
      <DirectionalTransition>
      <section className="page-grid">
        <h2>Term not found</h2>
        <p>{termError ?? "This slug is not present in the current published catalog manifest."}</p>
        <Button variant="link" asChild><Link to="/explore">
          Back to explore
        </Link></Button>
      </section>
      </DirectionalTransition>
    );
  }

  const activeTerm = term;
  const { core: coreBlocks, extras: extraTabs } = termBlockGroups;
  const note = notes[activeTerm.slug] ?? "";
  const isSaved = bookmarks.includes(activeTerm.slug);
  const userName = session?.user?.displayName?.trim() || session?.user?.email?.split("@")[0] || "Arjun";
  const noteCount = Object.values(notes).filter((value) => value.trim()).length;
  const dueReviews = getDueReviews();
  const quizAccuracy = computeQuizAccuracy(loadQuizAttempts());
  const streakDays = computeStreakDays(loadActivityDates());
  const hasQuiz = activeBlocks.some((block) => block.type === "quiz");
  const readMinutes = estimateReadMinutes(activeBlocks.length, activeTerm.summary.length);
  const definition = plainDefinition(activeTerm.title, activeTerm.summary);
  const furtherReading = buildFurtherReading(activeTerm.title);
  const badgeCounts = {
    saved: bookmarks.length,
    notes: noteCount,
    review: dueReviews.length,
  };
  const relatedConcepts: Array<{ label: string; slug: string | null; saved: boolean }> = [];
  const seenRelatedLabels = new Set<string>();
  for (const label of [...activeTerm.links.related, ...activeTerm.links.prerequisites, ...activeTerm.links.next]) {
    if (seenRelatedLabels.has(label)) {
      continue;
    }
    seenRelatedLabels.add(label);
    relatedConcepts.push({
      label,
      slug: resolveTermSlug(label),
      saved: bookmarks.some((slug) => termMap.get(slug)?.title === label),
    });
    if (relatedConcepts.length >= 4) {
      break;
    }
  }
  const activeTagLabels: string[] = [];
  const seenTagLabels = new Set<string>();
  for (const value of [activeTerm.taxonomy.category, activeTerm.taxonomy.subCategory, ...activeTerm.taxonomy.tags]) {
    if (!value) {
      continue;
    }
    const label = titleCaseLabel(value);
    if (seenTagLabels.has(label)) {
      continue;
    }
    seenTagLabels.add(label);
    activeTagLabels.push(label);
    if (activeTagLabels.length >= 5) {
      break;
    }
  }
  const availableLearnerTabs = learnerTabs.filter((tab) => {
    if (tab.id === "quick-quiz") return hasQuiz;
    if (tab.id === "notes") return true;
    if (tab.id === "compare") return extraTabs.some((extra) => extra.key === "compare");
    if (tab.id === "visuals") return activeBlocks.some((block) => block.type === "diagram" || block.id === "visual-summary");
    if (tab.id === "examples") return extraTabs.some((extra) => extra.key === "curriculum");
    return true;
  });
  const flashcardCount = Math.max(4, Math.min(12, activeTerm.aliases.length + relatedConcepts.length + activeTagLabels.length));

  const source = activeTerm.source.glossaryWorkbook;
  const sourceEvidenceItems = [
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
      sourceTrace: sourceEvidenceItems,
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
    <DirectionalTransition>
      <section className="learn-dashboard concept-detail-shell">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-brand">
            <div className="brand-mark" aria-hidden="true">
              <span className="brand-glyph">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div>
              <h2>AI Glossary Pro</h2>
              <p>v2</p>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Study sections">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive || item.label === "Library" ? "sidebar-nav-item is-active" : "sidebar-nav-item"
                  }
                >
                  <span className="sidebar-nav-label">
                    <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
                    <span>{item.label}</span>
                  </span>
                  {badge ? <span className="sidebar-badge">{badge}</span> : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="sidebar-topics">
            <p className="showcase-label">Explore by topic</p>
            {topicShortcuts.map((topic) => {
              const Icon = topic.icon;
              return (
                <Link key={topic.label} to="/explore" className="sidebar-topic-link">
                  <Icon aria-hidden="true" size={14} strokeWidth={1.9} />
                  <span>{topic.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="sidebar-upgrade-card">
            <div className="sidebar-upgrade-icon" aria-hidden="true">
              <Sparkles size={18} />
            </div>
            <strong>Go further with Pro</strong>
            <span>Advanced paths, quizzes, notes sync, and review memory.</span>
            <Button variant="accent" size="md" asChild>
              <Link to="/pricing">Upgrade now</Link>
            </Button>
          </div>
        </aside>

        <section className="dashboard-main concept-detail-main">
          <div className="dashboard-topbar">
            <div className="concept-title-kicker">
              <nav className="concept-breadcrumb" aria-label="Breadcrumb">
                <Link to="/explore">Library</Link>
                <span aria-hidden="true">/</span>
                <Link to={`/families/${studyFamilySlug}`}>{activeTerm.taxonomy.category}</Link>
                <span aria-hidden="true">/</span>
                <span>{activeTerm.taxonomy.subCategory}</span>
              </nav>
            </div>
            <div className="dashboard-topbar-actions">
              <Link className="concept-back-link" to="/explore" aria-label="Back to library">
                <ChevronLeft aria-hidden="true" size={16} />
              </Link>
              <label className="dashboard-search">
                <Search aria-hidden="true" size={17} />
                <span className="sr-only">Search any concept, compare ideas...</span>
                <input type="search" placeholder="Search any concept, compare ideas..." />
                <kbd>⌘ K</kbd>
              </label>
              <Link className="dashboard-status-pill" to="/review">
                <Flame aria-hidden="true" size={17} />
                <strong>{streakDays}</strong>
                <span>day streak</span>
              </Link>
              <Link className="dashboard-icon-button" to="/review" aria-label={`${dueReviews.length} reviews due`}>
                <Bell aria-hidden="true" size={18} />
                {dueReviews.length ? <span>{dueReviews.length}</span> : null}
              </Link>
              <Link className="dashboard-profile-chip" to="/account">
                <span className="dashboard-avatar" aria-hidden="true">
                  {initialsFor(userName)}
                </span>
                <span>
                  <strong>{userName}</strong>
                  <small>Premium</small>
                </span>
                <UserCircle aria-hidden="true" size={18} />
              </Link>
            </div>
          </div>

          <section className="concept-detail-grid">
            <main className="concept-content-column">
              <article className="concept-header-card">
                <div className="concept-header-copy">
                  <Badge variant="chip">{activeTerm.metadata.editorialTier ?? "featured"}</Badge>
                  <div className="concept-title-row">
                    <ViewTransition name={`term-title-${activeTerm.slug}`} share="text-morph">
                      <h1>{activeTerm.title}</h1>
                    </ViewTransition>
                    <button
                      className={`concept-save-button${isSaved ? " is-saved" : ""}`}
                      type="button"
                      aria-label={isSaved ? "Remove saved concept" : "Save concept"}
                      onClick={() => void toggleBookmark(activeTerm.slug)}
                    >
                      <Bookmark aria-hidden="true" size={21} />
                    </button>
                  </div>
                  <p className="concept-definition">{definition}</p>
                  <div className="concept-tag-row">
                    {activeTagLabels.map((tag) => (
                      <Badge key={tag} variant="chip">{tag}</Badge>
                    ))}
                  </div>
                  <div className="concept-meta-row">
                    <span><CheckCircle2 size={15} aria-hidden="true" /> {activeTerm.metadata.difficulty}</span>
                    <span>{readMinutes} min read</span>
                    {hasQuiz ? <span>Quiz available</span> : null}
                    <span>{flashcardCount} flashcards</span>
                  </div>
                </div>
                <div className="concept-header-actions">
                  <Button variant="raised" size="md" onClick={copyShareLink}>
                    <Share2 aria-hidden="true" size={16} /> Share
                  </Button>
                  <Button
                    variant="raised"
                    size="md"
                    onClick={() => document.getElementById("notes")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    <MessageSquarePlus aria-hidden="true" size={16} /> Add note
                  </Button>
                  <Button variant="accent" size="md" onClick={() => void toggleBookmark(activeTerm.slug)}>
                    <Save aria-hidden="true" size={16} /> {isSaved ? "Saved" : "Save"}
                  </Button>
                </div>
                {shareMessage ? <p className="concept-action-message">{shareMessage}</p> : null}
              </article>

              <nav className="concept-learner-tabs" aria-label="Concept sections">
                {availableLearnerTabs.map((tab) => (
                  <a key={tab.id} href={`#${tab.id}`}>
                    {tab.label}
                  </a>
                ))}
              </nav>

              <section className="concept-overview-panel" id="overview">
                <article className="concept-nutshell-card">
                  <div>
                    <p className="showcase-label">In a nutshell</p>
                    <h2>{activeTerm.title}</h2>
                    <p>
                      {definition} Start with the plain idea, then use the examples, comparisons,
                      and quiz to turn the definition into working understanding.
                    </p>
                  </div>
                  <div className="concept-flow-visual" aria-hidden="true">
                    <span className="attention-label attention-query">Query</span>
                    <span className="attention-label attention-keys">Keys</span>
                    <span className="attention-label attention-values">Values</span>
                    <span className="attention-box attention-score">Attention<br />Scores</span>
                    <span className="attention-box attention-weighted">Weighted<br />Sum</span>
                    <span className="attention-output">Output</span>
                    <i className="attention-line attention-line-a" />
                    <i className="attention-line attention-line-b" />
                    <i className="attention-line attention-line-c" />
                    <i className="attention-line attention-line-d" />
                  </div>
                </article>

                <div className="concept-summary-grid">
                  <article>
                    <p className="showcase-label">Why it matters</p>
                    <h3>It gives this idea a job.</h3>
                    <p>
                      This concept helps you understand how models, training choices, and system behavior connect
                      instead of memorizing a detached definition.
                    </p>
                  </article>
                  <article>
                    <p className="showcase-label">When to use</p>
                    <h3>Use it while reading or building.</h3>
                    <p>
                      Reach for this page when you need a quick reset before comparing adjacent concepts or following
                      a guided path.
                    </p>
                  </article>
                  <article>
                    <p className="showcase-label">Key idea</p>
                    <h3>Learn the mechanism, not only the label.</h3>
                    <p>
                      The page prioritizes intuition first, then lets you open the deeper blocks when you are ready.
                    </p>
                  </article>
                </div>
              </section>

              <section className="concept-wide-callout" id="visuals">
                <div>
                  <p className="showcase-label">Visual explanation</p>
                  <h2>Input → mechanism → signal → decision</h2>
                  <p>Input tokens produce queries, keys, and values. Attention scores decide what receives focus, then the weighted sum carries that signal forward.</p>
                </div>
                <div className="concept-process-flow" aria-hidden="true">
                  {["Input", "Query", "Keys/Values", "Attention", "Output"].map((step) => (
                    <span key={step}>{step}</span>
                  ))}
                </div>
              </section>

              <section className="concept-content-section" id="explanation">
                <div className="dashboard-section-heading">
                  <div>
                    <h2>Explanation</h2>
                    <p>Core blocks stay available, but the page now starts with the learning path.</p>
                  </div>
                </div>
                {coreBlocks.map((block) => (
                  <TermBlockRenderer key={block.id} block={block} />
                ))}
              </section>

              <section className="concept-content-section" id="how-it-works">
                <div className="dashboard-section-heading">
                  <div>
                    <h2>How it works</h2>
                    <p>Use these sections when the first explanation is not enough.</p>
                  </div>
                </div>
                <TermExtrasTabs tabs={extraTabs} activeKey={activeExtraTab} onSelect={setSelectedExtraTab} />
              </section>

              <section className="concept-content-section concept-notes-section" id="notes">
                <article className="term-block study-note-card">
                  <p className="showcase-label">Notes</p>
                  <h3>Keep your own explanation</h3>
                  <p>
                    {isRemoteBacked
                      ? "Your note is synced with your study workspace."
                      : "Your note is stored in this browser until account sync is active."}
                  </p>
                  <label className="search-panel">
                    <span>Personal note</span>
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
                  </label>
                  {note.trim() ? (
                    <div className="study-markdown-preview">
                      <p className="showcase-label">Rendered note</p>
                      <StudyRichText>{note}</StudyRichText>
                    </div>
                  ) : null}
                </article>

                <article className="term-block">
                  <p className="showcase-label">Annotations</p>
                  <h3>Save the part that mattered</h3>
                  {selectionCapture ? (
                    <div className="annotation-selection-card">
                      <p className="showcase-label">Selection ready</p>
                      <p>
                        The current text selection is attached to <strong>{selectionCapture.blockId}</strong>.
                      </p>
                      <StudyRichText variant="compact">{selectionCapture.text}</StudyRichText>
                      <div className="hero-actions">
                        <Button
                          variant="raised"
                          size="sm"
                          onClick={() => {
                            setSelectedBlockId(selectionCapture.blockId);
                            setAnnotationQuote(selectionCapture.text);
                          }}
                        >
                          Use selected text
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <label className="search-panel">
                    <span>Attach to section</span>
                    <select
                      name="annotationBlock"
                      value={selectedBlockId}
                      onChange={(event) => setSelectedBlockId(event.target.value)}
                    >
                      {getTermBlocks(term).map((block) => (
                        <option key={block.id} value={block.id}>
                          {block.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="search-panel">
                    <span>Annotation note</span>
                    <textarea
                      autoComplete="off"
                      value={annotationNote}
                      onChange={(event) => setAnnotationNote(event.target.value)}
                      name="annotationNote"
                      spellCheck={false}
                      placeholder="Write a focused annotation for this section."
                    />
                  </label>
                  <label className="search-panel">
                    <span>Selected excerpt</span>
                    <input
                      autoComplete="off"
                      value={annotationQuote}
                      onChange={(event) => setAnnotationQuote(event.target.value)}
                      name="annotationQuote"
                      spellCheck={false}
                      placeholder="Optional quote or exact phrase"
                    />
                  </label>
                  <div className="hero-actions">
                    <Button
                      variant="raised"
                      size="sm"
                      disabled={!isRemoteBacked || !annotationNote.trim()}
                      onClick={() => void createAnnotation()}
                    >
                      Save annotation
                    </Button>
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
                          <Button variant="link" onClick={() => {
                            void removeAnnotation(annotation.id, apiRequest).then(() => {
                              setAnnotations((current) => current.filter((item) => item.id !== annotation.id));
                            });
                          }}>
                            Remove annotation
                          </Button>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>
              </section>
            </main>

            <aside className="concept-right-rail">
              <article className="concept-rail-card">
                <p className="showcase-label">Study tools</p>
                <div className="study-tool-grid">
                  <a href="#quick-quiz"><HelpCircle size={18} aria-hidden="true" /><span>Practice quiz<small>{hasQuiz ? "1 question" : "Coming soon"}</small></span></a>
                  <a href="#how-it-works"><NotebookTabs size={18} aria-hidden="true" /><span>Flashcards<small>{flashcardCount} cards</small></span></a>
                  <a href="#notes"><MessageSquarePlus size={18} aria-hidden="true" /><span>Add note<small>Your thoughts</small></span></a>
                  <a href="#visuals"><Network size={18} aria-hidden="true" /><span>Diagrams<small>2 visuals</small></span></a>
                  <a href="#compare"><ClipboardCheck size={18} aria-hidden="true" /><span>Compare<small>Adjacent ideas</small></span></a>
                </div>
              </article>

              <article className="concept-rail-card">
                <p className="showcase-label">Your progress</p>
                <div className="dashboard-progress-ring-row">
                  <div className="dashboard-progress-ring" style={{ ["--progress" as string]: `${quizAccuracy ?? 0}%` }}>
                    <span>{quizAccuracy ?? 0}%</span>
                  </div>
                  <div>
                    <strong>{quizAccuracy === null ? "Not tested" : `${quizAccuracy}%`}</strong>
                    <span>Quiz score</span>
                    <strong>Today</strong>
                    <span>Last opened</span>
                  </div>
                </div>
                <Button variant="raised" size="sm" onClick={() => recordTermOpened(activeTerm.slug)}>
                  Mark as reviewed
                </Button>
              </article>

              <article className="concept-rail-card">
                <div className="dashboard-card-header">
                  <p className="showcase-label">Related concepts</p>
                  <Button variant="link" asChild>
                    <Link to="/explore">View all</Link>
                  </Button>
                </div>
                <div className="concept-related-list">
                  {relatedConcepts.length ? relatedConcepts.map((item, index) => (
                    item.slug ? (
                      <Link key={`${item.label}-${item.slug}-${index}`} to={`/term/${item.slug}`}>
                        <span>{item.label}</span>
                        <Bookmark size={15} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span key={`${item.label}-unlinked-${index}`}>{item.label}</span>
                    )
                  )) : <span>Related concepts are being mapped.</span>}
                </div>
              </article>

              {furtherReading.length ? (
                <article className="concept-rail-card">
                  <div className="dashboard-card-header">
                    <p className="showcase-label">Source & further reading</p>
                    <Button variant="link" asChild>
                      <a href={furtherReading[0].href} target="_blank" rel="noreferrer">View all</a>
                    </Button>
                  </div>
                  <div className="concept-source-list">
                    {furtherReading.map((item) => (
                      <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                        <FileText size={16} aria-hidden="true" />
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.source}</small>
                        </span>
                      </a>
                    ))}
                  </div>
                </article>
              ) : null}

              <article className="concept-rail-card">
                <div className="dashboard-card-header">
                  <p className="showcase-label">On this page</p>
                </div>
                <div className="concept-anchor-list">
                  {filteredStudyShortcuts.map((shortcut) => (
                    <a
                      key={shortcut.id}
                      href={`#${shortcut.id}`}
                      onClick={() => {
                        const tabKey = getBlockTabKey(shortcut.id);
                        if (tabKey) setSelectedExtraTab(tabKey);
                      }}
                    >
                      {shortcut.label}
                    </a>
                  ))}
                </div>
              </article>

              <article className="concept-rail-card">
                <p className="showcase-label">Was this helpful?</p>
                <div className="concept-feedback-row">
                  <button className={helpfulnessVote === "up" ? "is-active" : ""} type="button" onClick={() => setHelpfulnessVote("up")} aria-label="Helpful">
                    <ThumbsUp size={17} />
                  </button>
                  <button className={helpfulnessVote === "down" ? "is-active" : ""} type="button" onClick={() => setHelpfulnessVote("down")} aria-label="Not helpful">
                    <ThumbsDown size={17} />
                  </button>
                </div>
              </article>
            </aside>
          </section>
        </section>
      </section>
    </DirectionalTransition>
  );
}
