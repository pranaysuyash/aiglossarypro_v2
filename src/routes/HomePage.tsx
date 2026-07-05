import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  Bot,
  Boxes,
  Brain,
  ClipboardCheck,
  Flame,
  Home,
  Library,
  Network,
  NotebookTabs,
  Route,
  Search,
  Sparkles,
  StickyNote,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TermCard } from "../components/domain/term/TermCard";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { useAppState } from "../platform/AppContext";
import { useCatalog } from "../content/CatalogContext";
import { buildFamilyHighlights, familySlug } from "./familyHighlights";
import { useStudy } from "../study/StudyContext";
import { loadLastOpenedPathSlug } from "../study/storage";
import type { LearningPathSummary, TermSummary } from "../types";
import { getTermBlocks } from "../content/termBlocks";
import {
  computeQuizAccuracy,
  computeStreakDays,
  getDueReviews,
  loadActivityDates,
  loadOpenedTermSlugs,
  loadQuizAttempts,
} from "../study/progress";

type RecommendedConcept = {
  slug: string;
  title: string;
  reason: string;
  type: "concept" | "path" | "review";
  estimatedMinutes: number;
  saved: boolean;
};

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

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function inferPathLevel(termCount: number): string {
  if (termCount <= 12) return "Foundation";
  if (termCount <= 20) return "Intermediate";
  return "Advanced";
}

function estimateReadMinutes(term: TermSummary): number {
  const blockCount = getTermBlocks(term).length;
  const summaryMinutes = Math.max(3, Math.round(term.summary.length / 140));
  return Math.min(14, summaryMinutes + Math.min(4, blockCount));
}

function findPathForTerm(paths: LearningPathSummary[], slug: string | null): LearningPathSummary | null {
  if (!slug) return null;
  return paths.find((path) => path.featuredTermSlugs.includes(slug)) ?? null;
}

function pickNextPathTerm(
  path: LearningPathSummary | null,
  termMap: Map<string, TermSummary>,
  openedTermSlugs: string[],
  fallbackTerm: TermSummary | null,
): TermSummary | null {
  if (!path) {
    return fallbackTerm;
  }
  const openedSet = new Set(openedTermSlugs);
  const nextSlug = path.featuredTermSlugs.find((slug) => !openedSet.has(slug)) ?? path.featuredTermSlugs[0] ?? null;
  return nextSlug ? termMap.get(nextSlug) ?? fallbackTerm : fallbackTerm;
}

function buildRecommendedConcepts(
  paths: LearningPathSummary[],
  terms: TermSummary[],
  termMap: Map<string, TermSummary>,
  bookmarks: string[],
  notes: Record<string, string>,
  activePath: LearningPathSummary | null,
  lastOpenedTermSlug: string | null,
): RecommendedConcept[] {
  const bookmarkSet = new Set(bookmarks);
  const noteSet = new Set<string>();
  for (const [slug, body] of Object.entries(notes)) {
    if (body.trim()) {
      noteSet.add(slug);
    }
  }
  const activePathSlugs = activePath ? new Set(activePath.featuredTermSlugs) : new Set<string>();
  const activePathTerms: TermSummary[] = [];
  if (activePath) {
    for (const slug of activePath.featuredTermSlugs) {
      const term = termMap.get(slug);
      if (term) {
        activePathTerms.push(term);
      }
    }
  }

  const ranked: RecommendedConcept[] = [];
  const seen = new Set<string>();

  const pushConcept = (term: TermSummary | undefined, reason: string, type: RecommendedConcept["type"]) => {
    if (!term || seen.has(term.slug)) return;
    seen.add(term.slug);
    ranked.push({
      slug: term.slug,
      title: term.title,
      reason,
      type,
      estimatedMinutes: estimateReadMinutes(term),
      saved: bookmarkSet.has(term.slug),
    });
  };

  for (const term of activePathTerms) {
    if (term.slug === lastOpenedTermSlug) continue;
    pushConcept(
      term,
      activePath
        ? "This is part of the path you already started."
        : "A useful concept from a strong learning trail.",
      activePathSlugs.has(term.slug) ? "path" : "concept",
    );
    if (ranked.length >= 4) return ranked.slice(0, 4);
  }

  for (const slug of bookmarks) {
    if (ranked.length >= 4) break;
    pushConcept(
      termMap.get(slug),
      notes[slug]?.trim()
        ? "You saved and annotated this concept already."
        : "You saved this concept, so it is worth revisiting.",
      "review",
    );
  }

  for (const slug of noteSet) {
    if (ranked.length >= 4) break;
    pushConcept(
      termMap.get(slug),
      "You wrote about this concept, so it is ready for another pass.",
      "review",
    );
  }

  for (const path of paths) {
    if (ranked.length >= 4) break;
    for (const slug of path.featuredTermSlugs.slice(0, 2)) {
      if (ranked.length >= 4) break;
      pushConcept(
        termMap.get(slug),
        `A strong step from the ${path.title} trail.`,
        "path",
      );
    }
  }

  for (const term of terms) {
    if (ranked.length >= 4) break;
    pushConcept(
      term,
      term.metadata.editorialTier === "featured"
        ? "A curated deep-dive term with stronger learning signal."
        : "A useful adjacent concept for building context.",
      "concept",
    );
  }

  return ranked.slice(0, 4);
}

/** Progress is real: how many of the path's featured concepts the learner has
 * actually opened, not a fabricated step position. */
function pickPathProgress(
  paths: LearningPathSummary[],
  lastOpenedPathSlug: string | null,
  lastOpenedTermSlug: string | null,
  openedTermSlugs: string[],
): {
  path: LearningPathSummary | null;
  openedCount: number;
  totalCount: number;
  progressPercent: number;
} {
  const storedPath = lastOpenedPathSlug ? paths.find((path) => path.slug === lastOpenedPathSlug) ?? null : null;
  const matchedPath = storedPath ?? findPathForTerm(paths, lastOpenedTermSlug);
  if (!matchedPath) {
    return { path: null, openedCount: 0, totalCount: 0, progressPercent: 0 };
  }

  const openedSet = new Set(openedTermSlugs);
  const totalCount = matchedPath.featuredTermSlugs.length;
  const openedCount = matchedPath.featuredTermSlugs.filter((slug) => openedSet.has(slug)).length;
  const progressPercent = totalCount ? Math.round((openedCount / totalCount) * 100) : 0;

  return { path: matchedPath, openedCount, totalCount, progressPercent };
}

export function HomePage() {
  const navigate = useNavigate();
  const { session, isLoading: appStateLoading } = useAppState();
  const { paths, terms, termMap, pathMap, isLoading, error, reloadCatalog } = useCatalog();
  const { bookmarks, notes, lastOpenedTermSlug } = useStudy();
  const [storedLastPathSlug] = useState(() => loadLastOpenedPathSlug());

  const isAuthenticated = Boolean(session?.authenticated);
  const userName = session?.user?.displayName?.trim() || session?.user?.email?.split("@")[0] || "there";
  const featuredPaths = paths.slice(0, 6);
  const featuredTerms = useMemo(() => {
    const result: typeof terms = [];
    const seen = new Set<string>();
    for (const path of featuredPaths) {
      for (const slug of path.featuredTermSlugs) {
        if (seen.has(slug)) continue;
        seen.add(slug);
        const term = termMap.get(slug);
        if (term) result.push(term);
        if (result.length >= 6) break;
      }
      if (result.length >= 6) break;
    }
    return result;
  }, [featuredPaths, termMap]);
  const familyCards = useMemo(() => buildFamilyHighlights(terms).slice(0, 6), [terms]);
  const openedTermSlugs = useMemo(() => loadOpenedTermSlugs(), []);
  const activePathProgress = useMemo(
    () => pickPathProgress(paths, storedLastPathSlug, lastOpenedTermSlug, openedTermSlugs),
    [lastOpenedTermSlug, openedTermSlugs, paths, storedLastPathSlug],
  );
  const activePath = activePathProgress.path;
  const activeTerm = lastOpenedTermSlug ? termMap.get(lastOpenedTermSlug) ?? null : null;
  const nextStudyTerm = pickNextPathTerm(activePath, termMap, openedTermSlugs, activeTerm);
  const lastOpenedPath = storedLastPathSlug ? pathMap.get(storedLastPathSlug) ?? null : null;
  const recentOpenedTerms = useMemo(
    () =>
      [...openedTermSlugs]
        .reverse()
        .map((slug) => termMap.get(slug))
        .filter((term): term is TermSummary => Boolean(term))
        .slice(0, 4),
    [openedTermSlugs, termMap],
  );
  const noteCount = Object.values(notes).filter((value) => value.trim()).length;
  const savedCount = bookmarks.length;
  const recommendedConcepts = useMemo(
    () => buildRecommendedConcepts(paths, terms, termMap, bookmarks, notes, activePath, lastOpenedTermSlug),
    [activePath, bookmarks, lastOpenedTermSlug, notes, paths, termMap, terms],
  );

  // Real, locally-tracked study signals — no placeholder numbers. Streak and
  // quiz accuracy are derived from actual recorded activity; the review
  // queue only ever contains terms the learner has actually quizzed on.
  const streakDays = useMemo(() => computeStreakDays(loadActivityDates()), []);
  const quizAccuracy = useMemo(() => computeQuizAccuracy(loadQuizAttempts()), []);
  const dueReviews = useMemo(() => getDueReviews(), []);
  const dueReviewTerms = useMemo(
    () =>
      dueReviews
        .map((entry) => termMap.get(entry.termSlug))
        .filter((term): term is TermSummary => Boolean(term))
        .slice(0, 3),
    [dueReviews, termMap],
  );
  const overallProgressPercent = activePath ? activePathProgress.progressPercent : 0;
  const learnedConceptCount = openedTermSlugs.length;
  const badgeCounts = {
    saved: savedCount,
    notes: noteCount,
    review: dueReviews.length,
  };

  if (appStateLoading) {
    return (
      <DirectionalTransition>
        <section className="page-grid">
          <article className="summary-card">
            <h3>Loading your study space…</h3>
            <p>Checking session state and the current published catalog.</p>
          </article>
        </section>
      </DirectionalTransition>
    );
  }

  if (isAuthenticated) {
    return (
      <DirectionalTransition>
        <section className="learn-dashboard">
          <aside className="dashboard-sidebar">
            <div className="dashboard-sidebar-brand">
              <div className="brand-mark" aria-hidden="true">
                <span>A</span>
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
                    className={({ isActive }) => (isActive ? "sidebar-nav-item is-active" : "sidebar-nav-item")}
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
              <p className="showcase-label">Topic shortcuts</p>
              {topicShortcuts.map((topic) => {
                const Icon = topic.icon;
                const targetPath = paths.find((path) => path.title.toLowerCase().includes(topic.label.toLowerCase().replace(/\s*&\s*/g, " ").toLowerCase())) ?? paths.find((path) => path.category.toLowerCase().includes(topic.label.split(" ")[0].toLowerCase())) ?? null;
                return (
                  <Link
                    key={topic.label}
                    to={targetPath ? `/paths/${targetPath.slug}` : "/paths"}
                    className="sidebar-topic-link"
                  >
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
              <span>Advanced paths, unlimited quizzes, notes sync, and review memory.</span>
              <Button variant="accent" size="md" asChild>
                <Link to="/pricing">Upgrade now</Link>
              </Button>
            </div>
          </aside>

          <section className="dashboard-main">
            <div className="dashboard-topbar">
              <div>
                <h1>Welcome back, {userName}</h1>
                <p>Keep learning. Small steps, big understanding.</p>
              </div>
              <div className="dashboard-topbar-actions">
                <label className="dashboard-search">
                  <Search aria-hidden="true" size={17} />
                  <span className="sr-only">Search any concept, compare ideas…</span>
                  <input
                    type="search"
                    placeholder="Search any concept, compare ideas..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const value = (event.currentTarget as HTMLInputElement).value.trim();
                        if (value) {
                          navigate(`/explore?q=${encodeURIComponent(value)}`);
                        }
                      }
                    }}
                  />
                  <kbd>⌘ K</kbd>
                </label>
                <Link className="dashboard-status-pill" to="/review">
                  <Flame aria-hidden="true" size={17} />
                  <strong>{streakDays || 0}</strong>
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

            <section className="dashboard-workspace">
              <div className="dashboard-content-column">
                <article className="dashboard-continue-card">
                  <div className="dashboard-continue-visual" aria-hidden="true">
                    <div className="attention-sketch">
                      <span className="sketch-node sketch-node-query">Query</span>
                      <span className="sketch-node sketch-node-key">Key</span>
                      <span className="sketch-node sketch-node-value">Value</span>
                      <span className="sketch-line sketch-line-a" />
                      <span className="sketch-line sketch-line-b" />
                      <span className="sketch-box">Attention<br />Scores</span>
                      <span className="sketch-arrow" />
                      <span className="sketch-output">Output</span>
                    </div>
                  </div>
                  <div className="dashboard-continue-copy">
                    <div className="dashboard-card-header">
                      <p className="showcase-label">Continue your journey</p>
                      {activePath ? (
                        <Button variant="link" asChild>
                          <Link to={`/paths/${activePath.slug}`}>View path</Link>
                        </Button>
                      ) : null}
                    </div>
                    {nextStudyTerm ? (
                      <>
                        <Badge variant="chip">
                          {activePath
                            ? activeTerm?.slug === nextStudyTerm.slug
                              ? `Resume ${activePath.title}`
                              : `Next in ${activePath.title}`
                            : "Recent study"}
                        </Badge>
                        <h2>{nextStudyTerm.title}</h2>
                        <div className="dashboard-progress-bar" aria-hidden="true">
                          <span style={{ width: `${activePathProgress.progressPercent}%` }} />
                        </div>
                        <div className="dashboard-progress-row">
                          <span>{activePath ? `${activePathProgress.progressPercent}% complete` : "No path progress yet"}</span>
                          <span>
                            {activePath
                              ? `${activePathProgress.openedCount} of ${activePathProgress.totalCount} opened`
                              : "Choose a path to start tracking"}
                          </span>
                        </div>
                        <Button variant="accent" size="md" asChild>
                          <Link to={`/term/${nextStudyTerm.slug}`}>Continue</Link>
                        </Button>
                      </>
                    ) : activePath ? (
                      <>
                        <Badge variant="chip">{activePath.termCount} concepts</Badge>
                        <h2>{activePath.title}</h2>
                        <p className="dashboard-card-subtitle">{activePath.description}</p>
                        <Button variant="accent" size="md" asChild>
                          <Link to={`/paths/${activePath.slug}`}>Continue</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <h2>Start your first path</h2>
                        <p className="dashboard-card-subtitle">
                          Pick a guided trail and the dashboard will remember the next concept here.
                        </p>
                        <Button variant="accent" size="md" asChild>
                          <Link to="/paths">Find my path</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </article>

                <section className="dashboard-section">
                  <div className="dashboard-section-heading">
                    <div>
                      <h2>Recommended for you</h2>
                      <p>Practical next steps from your path, saves, notes, and catalog graph.</p>
                    </div>
                    <Button variant="link" asChild>
                      <Link to="/explore">View all</Link>
                    </Button>
                  </div>
                  <div className="recommendation-grid">
                    {recommendedConcepts.map((item, index) => (
                      <article key={item.slug} className="recommendation-card">
                        <div className={`recommendation-visual recommendation-visual-${index % 4}`} aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </div>
                        <div className="recommendation-card-head">
                          <Badge variant="chip">{item.type}</Badge>
                          {item.saved ? <Badge variant="chip">Saved</Badge> : null}
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.reason}</p>
                        <div className="recommendation-meta">
                          <span>{item.estimatedMinutes} min read</span>
                          <Bookmark aria-hidden="true" size={16} />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="dashboard-section">
                  <div className="dashboard-section-heading">
                    <div>
                      <h2>Pick up a path</h2>
                      <p>Guided trails keep the next decision obvious.</p>
                    </div>
                    <Button variant="link" asChild>
                      <Link to="/paths">View all paths</Link>
                    </Button>
                  </div>
                  <div className="path-progress-grid">
                    {featuredPaths.slice(0, 4).map((path) => {
                      const isActive = activePath?.slug === path.slug;
                      const openedInPath = path.featuredTermSlugs.filter((slug) => openedTermSlugs.includes(slug)).length;
                      const progress = path.featuredTermSlugs.length
                        ? Math.round((openedInPath / path.featuredTermSlugs.length) * 100)
                        : 0;
                      return (
                        <article key={path.slug} className={`path-progress-card${isActive ? " is-active" : ""}`}>
                          <div className="path-progress-head">
                            <div className="path-icon-tile" aria-hidden="true">
                              <Route size={18} />
                            </div>
                            <div>
                              <h3>{path.title}</h3>
                              <span>{path.termCount} concepts</span>
                            </div>
                          </div>
                          <div className="dashboard-progress-bar" aria-hidden="true">
                            <span style={{ width: `${progress}%` }} />
                          </div>
                          <div className="path-progress-meta">
                            <span>{inferPathLevel(path.termCount)}</span>
                            <span>{progress ? `${progress}%` : "Not started"}</span>
                          </div>
                          <Button variant={isActive ? "accent" : "raised"} size="md" asChild>
                            <Link to={`/paths/${path.slug}`}>{isActive ? "Continue" : "Open path"}</Link>
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="dashboard-section dashboard-callout">
                  <div>
                    <p className="eyebrow">Not sure where to start?</p>
                    <h2>Take a quick path check.</h2>
                    <p>Use the path view when you are choosing between basics, neural nets, and LLMs.</p>
                  </div>
                  <Button variant="accent" size="md" asChild>
                    <Link to="/paths">Find my path</Link>
                  </Button>
                </section>
              </div>

              <aside className="dashboard-summary-rail">
                <article className="dashboard-summary-card">
                  <div className="dashboard-card-header">
                    <p className="showcase-label">Your progress</p>
                    <Button variant="link" asChild>
                      <Link to="/account">View stats</Link>
                    </Button>
                  </div>
                  <div className="dashboard-progress-ring-row">
                    <div className="dashboard-progress-ring" style={{ ["--progress" as string]: `${overallProgressPercent}%` }}>
                      <span>{overallProgressPercent}%</span>
                    </div>
                    <div>
                      <strong>{learnedConceptCount} / {Math.max(activePathProgress.totalCount, learnedConceptCount || 1)}</strong>
                      <span>Concepts opened</span>
                      <strong>{quizAccuracy === null ? "—" : `${quizAccuracy}%`}</strong>
                      <span>Quiz avg. score</span>
                    </div>
                  </div>
                </article>

                <article className="dashboard-summary-card">
                  <div className="dashboard-card-header">
                    <p className="showcase-label">Review this week</p>
                    {dueReviews.length ? <Badge variant="chip">{dueReviews.length} due</Badge> : null}
                  </div>
                  <div className="dashboard-review-list">
                    {dueReviewTerms.map((term) => (
                      <Link key={term.slug} to={`/term/${term.slug}#quick-quiz`} className="dashboard-review-item">
                        <strong>{term.title}</strong>
                        <span>Review due</span>
                      </Link>
                    ))}
                    {dueReviewTerms.length === 0 ? (
                      <p className="dashboard-empty-copy">
                        Answer a quiz on any term and it will come back here for spaced review.
                      </p>
                    ) : null}
                  </div>
                  <Button variant="link" asChild>
                    <Link to="/review">Go to review queue</Link>
                  </Button>
                </article>

                <article className="dashboard-summary-card">
                  <div className="dashboard-card-header">
                    <p className="showcase-label">Recently opened</p>
                    <Button variant="link" asChild>
                      <Link to="/explore">View all</Link>
                    </Button>
                  </div>
                  <div className="dashboard-review-list">
                    {recentOpenedTerms.length ? (
                      recentOpenedTerms.map((term) => (
                        <Link key={term.slug} to={`/term/${term.slug}`} className="dashboard-review-item">
                          <strong>{term.title}</strong>
                          <span>{activePath?.featuredTermSlugs.includes(term.slug) ? "In path" : "Recent"}</span>
                        </Link>
                      ))
                    ) : (
                      <p className="dashboard-empty-copy">Open a term and it will appear here next time.</p>
                    )}
                    {lastOpenedPath ? (
                      <Link className="dashboard-review-item" to={`/paths/${lastOpenedPath.slug}`}>
                        <strong>{lastOpenedPath.title}</strong>
                        <span>{lastOpenedPath.termCount} concepts</span>
                      </Link>
                    ) : null}
                  </div>
                </article>

                <article className="dashboard-summary-card dashboard-streak-card">
                  <p className="showcase-label">Study streak</p>
                  <strong>{streakDays > 0 ? `${streakDays} days in a row` : "Start today"}</strong>
                  <div className="dashboard-week-strip" aria-label="Weekly streak preview">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <span key={`${day}-${index}`} className={index >= 7 - Math.min(streakDays, 7) ? "dashboard-week-dot dashboard-week-dot-active" : "dashboard-week-dot"}>
                        {day}
                      </span>
                    ))}
                  </div>
                </article>
              </aside>
            </section>
          </section>
        </section>
      </DirectionalTransition>
    );
  }

  return (
    <DirectionalTransition>
      <section className="page-grid landing-page">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="eyebrow landing-hero-kicker">A structured way to learn AI, ML & DL</p>
            <h1>Understand the concepts. Build real mastery.</h1>
            <p className="landing-hero-lead">
              AI Glossary Pro is a learning system for artificial intelligence, machine learning, and deep learning.
              Learn concepts in context, follow guided paths, test your understanding, and remember what matters.
            </p>
            <div className="hero-actions">
              <Button variant="accent" size="md" asChild>
                <Link to="/paths">Start learning</Link>
              </Button>
              <Button variant="raised" size="md" asChild>
                <Link to="/explore">Explore a concept</Link>
              </Button>
            </div>
            <div className="landing-trust-row">
              <span>Trusted by learners</span>
              <span>Expert curated</span>
              <span>Always up to date</span>
            </div>
          </div>

          <aside className="landing-preview-card">
            <p className="showcase-label">Continue your journey</p>
            <h2>{featuredPaths[0]?.featuredTermSlugs[0] ? termMap.get(featuredPaths[0].featuredTermSlugs[0])?.title ?? "Attention Mechanism" : "Attention Mechanism"}</h2>
            <p className="landing-preview-subtitle">In Transformers Path</p>
            <div className="dashboard-progress-bar" aria-hidden="true">
              <span style={{ width: "65%" }} />
            </div>
            <p className="dashboard-progress-caption">65% complete</p>
            <div className="hero-actions">
              <Button variant="accent" size="md" asChild>
                <Link to="/paths">Continue</Link>
              </Button>
              <Button variant="raised" size="md" asChild>
                <Link to="/explore">View paths</Link>
              </Button>
            </div>
            <div className="landing-preview-stats">
              <div>
                <strong>{terms.length.toLocaleString()}</strong>
                <span>concepts</span>
              </div>
              <div>
                <strong>{paths.length.toLocaleString()}</strong>
                <span>paths</span>
              </div>
              <div>
                <strong>{familyCards.length}</strong>
                <span>families</span>
              </div>
              <div>
                <strong>{featuredTerms.filter((term) => term.metadata.editorialTier === "featured").length}</strong>
                <span>deep dives</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="landing-strip-card">
          <div className="section-header">
            <p className="eyebrow">Popular learning paths</p>
            <h2>Start with a guided route instead of wandering from term to term.</h2>
            <p>
              The best on-ramp for AI, ML, and DL is sequence, not search alone. These paths give the app a point of view.
            </p>
          </div>
          <div className="landing-path-strip">
            {featuredPaths.map((path) => (
              <article key={path.slug} className="landing-path-card">
                <p className="showcase-label">{inferPathLevel(path.termCount)}</p>
                <h3>{path.title}</h3>
                <p>{path.termCount} concepts</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-features">
          {[
            {
              title: "Structured paths",
              body: "Follow step-by-step learning paths designed to build understanding in the right order.",
            },
            {
              title: "Concept families",
              body: "See how related ideas connect, differ, and stack into a mental model.",
            },
            {
              title: "Smart search",
              body: "Find a concept, compare ideas, and open a clearer explanation fast.",
            },
            {
              title: "Practice and retain",
              body: "Use quizzes, notes, bookmarks, and review to remember what you study.",
            },
          ].map((feature) => (
            <article key={feature.title} className="landing-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </section>

        <section className="landing-benefits">
          <div className="section-header">
            <p className="eyebrow">Built for deep understanding</p>
            <h2>Designed for people who need more than a definition.</h2>
            <p>
              The experience centers on plain language, visual summaries, comparisons, examples, and practice.
            </p>
          </div>
          <div className="landing-benefit-pills">
            {[
              "Plain language explanations",
              "Diagrams and visual summaries",
              "Real-world examples",
              "Compare and contrast",
              "Quizzes and misconceptions",
              "Notes and annotations",
            ].map((pill) => (
              <span key={pill}>{pill}</span>
            ))}
          </div>
        </section>

        {familyCards.length > 0 ? (
          <section className="landing-strip-card">
            <div className="section-header">
              <p className="eyebrow">Concept families</p>
              <h2>The deepest content is curated, not flattened.</h2>
              <p>
                These are the families where the comparison and deep-dive experience is strongest.
              </p>
            </div>
            <div className="family-lane-grid">
              {familyCards.map((family) => (
                <article key={family.title} className="family-lane-card">
                  <p className="showcase-label">{family.title}</p>
                  <h3>{family.note}</h3>
                  <p>{family.whyItMatters}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="chip">{family.count} terms</Badge>
                    <Badge variant="chip">{family.featuredCount} flagship</Badge>
                  </div>
                  <div className="hero-actions">
                    <Button variant="link" asChild>
                      <Link to={`/families/${familySlug(family.title)}`}>Family lane</Link>
                    </Button>
                    {family.strongestTerm ? (
                      <Button variant="link" asChild>
                        <Link to={`/term/${family.strongestTerm.slug}`}>Start here</Link>
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="landing-strip-card">
          <div className="section-header">
            <p className="eyebrow">Featured concepts</p>
            <h2>Start with the ideas that deserve a deeper read.</h2>
            <p>
              These terms have enough signal to support richer examples, diagrams, and comparisons.
            </p>
          </div>
          {isLoading ? (
            <article className="summary-card">
              <h3>Loading catalog…</h3>
              <p>Reading the current published term manifest.</p>
            </article>
          ) : error ? (
            <article className="summary-card">
              <h3>Catalog unavailable</h3>
              <p>{error}</p>
              <Button variant="raised" size="md" onClick={reloadCatalog}>
                Retry load
              </Button>
            </article>
          ) : (
            <div className="featured-grid">
              {featuredTerms.map((term) => (
                <TermCard key={term.slug} term={term} />
              ))}
            </div>
          )}
        </section>

        <section className="landing-final-cta">
          <div>
            <p className="eyebrow">Ready to start?</p>
            <h2>Learn the right concepts in the right order.</h2>
            <p>
              Join with a clear path, a working memory, and a place to return when the idea needs a second pass.
            </p>
          </div>
          <Button variant="accent" size="md" asChild>
            <Link to="/paths">Start your free journey</Link>
          </Button>
        </section>
      </section>
    </DirectionalTransition>
  );
}
