import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewTransition } from "react";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import type { LearningPathRecord, LearningPathStep } from "../types";
import { useCatalog } from "../content/CatalogContext";
import { loadOpenedTermSlugs } from "../study/progress";
import { saveLastOpenedPathSlug } from "../study/storage";

const STAGE_LABELS: Record<LearningPathStep["stage"], string> = {
  start: "Foundations",
  build: "Build",
  advance: "Advance",
};

const STAGE_ORDER: LearningPathStep["stage"][] = ["start", "build", "advance"];

function estimateStepMinutes(step: LearningPathStep): number {
  const words = `${step.summary} ${step.whyIncluded}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 90) + 2);
}

export function PathDetailPage() {
  const { pathSlug = "" } = useParams();
  const { termMap, loadPath, isLoading: isCatalogLoading, error: catalogError } = useCatalog();
  const [path, setPath] = useState<LearningPathRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum">("overview");

  useEffect(() => {
    let isCancelled = false;

    async function loadCurrentPath() {
      setIsLoading(true);
      setError(null);
      try {
        const payload = await loadPath(pathSlug);
        if (!isCancelled) {
          setPath(payload);
          if (!payload) {
            setError("This path is not present in the current published path catalog.");
          } else {
            saveLastOpenedPathSlug(payload.slug);
          }
        }
      } catch (loadError) {
        if (!isCancelled) {
          setPath(null);
          setError(loadError instanceof Error ? loadError.message : "Path load failed");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrentPath();

    return () => {
      isCancelled = true;
    };
  }, [loadPath, pathSlug]);

  const openedTermSlugs = useMemo(() => new Set(loadOpenedTermSlugs()), []);

  const { stageGroups, openedCount } = useMemo(() => {
    if (!path) return { stageGroups: [], openedCount: 0 };
    const bucketed: Record<string, import("../types").LearningPathStep[]> = {};
    const groups: Array<{ stage: string; label: string; steps: import("../types").LearningPathStep[] }> = [];
    for (const stage of STAGE_ORDER) {
      bucketed[stage] = [];
    }
    let opened = 0;
    for (const step of path.steps) {
      if (bucketed[step.stage]) {
        bucketed[step.stage].push(step);
      }
      if (openedTermSlugs.has(step.slug)) {
        opened++;
      }
    }
    for (const stage of STAGE_ORDER) {
      const steps = bucketed[stage];
      if (steps.length) {
        groups.push({ stage, label: STAGE_LABELS[stage], steps });
      }
    }
    return {
      stageGroups: groups,
      openedCount: opened,
    };
  }, [openedTermSlugs, path]);
  const totalCount = path?.steps.length ?? 0;
  const progressPercent = totalCount ? Math.round((openedCount / totalCount) * 100) : 0;
  const totalMinutes = useMemo(
    () => (path ? path.steps.reduce((sum, step) => sum + estimateStepMinutes(step), 0) : 0),
    [path],
  );

  const topicsCovered = useMemo(() => {
    if (!path) return [];
    const seen = new Set<string>();
    const topics: string[] = [];
    for (const step of path.steps) {
      const term = termMap.get(step.slug);
      const topic = term?.taxonomy.subCategory || term?.taxonomy.category;
      if (topic && !seen.has(topic)) {
        seen.add(topic);
        topics.push(topic);
      }
    }
    return topics.slice(0, 8);
  }, [path, termMap]);

  const prerequisites = useMemo(() => {
    if (!path) return [];
    const pathSlugs = new Set(path.steps.map((step) => step.slug));
    const seen = new Set<string>();
    const list: string[] = [];
    const startGroup = stageGroups.find((g) => g.stage === "start");
    for (const step of startGroup?.steps ?? []) {
      const term = termMap.get(step.slug);
      for (const label of term?.links.prerequisites ?? []) {
        if (!seen.has(label) && !pathSlugs.has(label)) {
          seen.add(label);
          list.push(label);
        }
      }
    }
    return list.slice(0, 6);
  }, [path, termMap, stageGroups]);

  if (isCatalogLoading || isLoading) {
    return (
      <DirectionalTransition>
        <section className="page-grid">
          <h2>Loading path…</h2>
          <p>Preparing the published learning trail.</p>
        </section>
      </DirectionalTransition>
    );
  }

  if (catalogError || error || !path) {
    return (
      <DirectionalTransition>
        <section className="page-grid">
          <h2>Learning trail syncing</h2>
          <p>{error ?? catalogError ?? "This path could not be loaded."}</p>
          <Button variant="link" asChild>
            <Link to="/paths">Back to paths</Link>
          </Button>
        </section>
      </DirectionalTransition>
    );
  }

  const nextStep = path.steps.find((step) => !openedTermSlugs.has(step.slug)) ?? path.steps[0] ?? null;

  return (
    <DirectionalTransition>
      <section className="page-grid">
        <header className="path-detail-header">
          <div className="path-detail-header-copy">
            <p className="eyebrow">
              {path.category} / {path.subCategory}
            </p>
            <ViewTransition name={`path-title-${path.slug}`} share="text-morph">
              <h1>{path.title}</h1>
            </ViewTransition>
            <p className="term-hero-intro">{path.description}</p>
            <div className="path-detail-meta-row">
              <span>{path.termCount} concepts</span>
              <span>{path.steps.length} guided steps</span>
              <span>Approx. {totalMinutes} min</span>
            </div>
          </div>
          <div className="hero-actions">
            {nextStep ? (
              <Button variant="accent" size="md" asChild>
                <Link to={`/term/${nextStep.slug}`}>{openedCount > 0 ? "Resume" : "Start"}</Link>
              </Button>
            ) : null}
            <Button variant="raised" size="md" asChild>
              <Link to="/saved">Save path</Link>
            </Button>
          </div>
        </header>

        <div className="term-extras-tablist" role="tablist" aria-label="Path sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`term-extras-tab ${activeTab === "overview" ? "term-extras-tab-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "curriculum"}
            className={`term-extras-tab ${activeTab === "curriculum" ? "term-extras-tab-active" : ""}`}
            onClick={() => setActiveTab("curriculum")}
          >
            Curriculum ({path.steps.length})
          </button>
        </div>

        <div className="path-detail-grid">
          <div className="path-detail-main">
            {activeTab === "overview" ? (
              <div className="path-detail-overview">
                <article className="path-progress-panel">
                  <p className="showcase-label">Your progress</p>
                  <div className="path-progress-ring-row">
                    <div
                      className="path-progress-ring"
                      style={{ ["--progress" as string]: `${progressPercent}%` }}
                    >
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="path-progress-ring-meta">
                      <strong>
                        {openedCount} / {totalCount} concepts opened
                      </strong>
                      <div className="dashboard-progress-bar">
                        <span style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span className="term-metrics">
                        {openedCount === 0 ? "Not started yet" : openedCount === totalCount ? "Path complete" : "In progress"}
                      </span>
                    </div>
                  </div>
                </article>

                {stageGroups.length ? (
                  <article className="path-progress-panel">
                    <p className="showcase-label">What this path covers</p>
                    <div className="path-stage-summary">
                      {stageGroups.map((group) => {
                        const groupOpened = group.steps.filter((step) => openedTermSlugs.has(step.slug)).length;
                        return (
                          <div key={group.stage} className="path-stage-summary-row">
                            <span className={`path-stage-dot path-stage-dot-${group.stage}`} />
                            <strong>{group.label}</strong>
                            <span className="term-metrics">
                              {group.steps.length} concepts · {groupOpened} opened
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ) : null}
              </div>
            ) : (
              <div className="path-curriculum">
                {stageGroups.map((group) => (
                  <section key={group.stage} className={`path-stage-block path-stage-block-${group.stage}`}>
                    <div className="path-stage-block-head">
                      <span className={`path-stage-dot path-stage-dot-${group.stage}`} />
                      <div>
                        <h3>{group.label}</h3>
                        <p className="term-metrics">{group.steps.length} concepts</p>
                      </div>
                    </div>
                    <ol className="path-step-list">
                      {group.steps.map((step, index) => {
                        const isOpened = openedTermSlugs.has(step.slug);
                        return (
                          <li key={step.slug} className={`path-step-row ${isOpened ? "path-step-row-done" : ""}`} style={{ contentVisibility: "auto", containIntrinsicSize: "0 100px" }}>
                            <span className="path-step-index" aria-hidden="true">
                              {isOpened ? "✓" : index + 1}
                            </span>
                            <Link className="path-step-link" to={`/term/${step.slug}`}>
                              <strong>{step.title}</strong>
                              <span className="term-metrics">{step.whyIncluded}</span>
                            </Link>
                            <span className="path-step-minutes">{estimateStepMinutes(step)} min</span>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside className="path-detail-rail">
            <article className="term-signal-card">
              <p className="showcase-label">About this path</p>
              <p>{path.description}</p>
            </article>

            {topicsCovered.length ? (
              <article className="term-signal-card">
                <p className="showcase-label">Topics covered</p>
                <div className="flex flex-wrap gap-2">
                  {topicsCovered.map((topic) => (
                    <Badge key={topic} variant="chip">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </article>
            ) : null}

            {prerequisites.length ? (
              <article className="term-signal-card">
                <p className="showcase-label">Prerequisites</p>
                <ul className="path-prereq-list">
                  {prerequisites.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </article>
            ) : null}
          </aside>
        </div>
      </section>
    </DirectionalTransition>
  );
}
