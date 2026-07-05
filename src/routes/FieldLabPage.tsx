import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DirectionalTransition } from "../components/shared/DirectionalTransition";
import { useCatalog } from "../content/CatalogContext";
import {
  loadPublishedLaunchContract,
  type PublishedLaunchContract,
} from "../content/launchContract";
import {
  loadPublishedCorpusManifest,
  type PublishedCorpusManifest,
} from "../content/publishedManifest";
import {
  loadPublishedStructureRegistry,
  type PublishedStructureRegistry,
} from "../content/structureRegistry";
import { useStudy } from "../study/StudyContext";
import { FieldLabTermInspection } from "./FieldLabTermInspection";

export function FieldLabPage() {
  const { terms, paths, isLoading, error, reloadCatalog } = useCatalog();
  const { bookmarks, notes } = useStudy();
  const [manifest, setManifest] = useState<PublishedCorpusManifest | null>(null);
  const [registry, setRegistry] = useState<PublishedStructureRegistry | null>(null);
  const [launchContract, setLaunchContract] = useState<PublishedLaunchContract | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadDiagnostics() {
      const [nextManifest, nextRegistry, nextLaunchContract] = await Promise.all([
        loadPublishedCorpusManifest(),
        loadPublishedStructureRegistry(),
        loadPublishedLaunchContract(),
      ]);
      if (isCancelled) {
        return;
      }
      setManifest(nextManifest);
      setRegistry(nextRegistry);
      setLaunchContract(nextLaunchContract);
    }

    void loadDiagnostics();
    return () => {
      isCancelled = true;
    };
  }, []);

  const noteCount = useMemo(
    () => Object.values(notes).filter((value) => value.trim()).length,
    [notes],
  );
  const sampleTerm = terms[0] ?? null;
  const sampleFeaturedTerm =
    terms.find((term) => term.metadata.editorialTier === "featured") ?? sampleTerm;
  const sampleInteractiveTerm = sampleFeaturedTerm;
  const samplePath = paths[0] ?? null;
  const topFamilies = useMemo(() => {
    const groups = new Map<string, number>();
    for (const term of terms) {
      const label = term.metadata.studyFamily || term.taxonomy.category || "Unclassified";
      groups.set(label, (groups.get(label) ?? 0) + 1);
    }
    return Array.from(groups.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10);
  }, [terms]);

  const routeSurfaces = useMemo(
    () => [
      {
        label: "Entry",
        title: "Home command deck",
        description: "The first screen should orient the learner and expose the product, not just the brand.",
        to: "/",
        action: "Open home",
      },
      {
        label: "Catalog",
        title: "Library and term search",
        description: "Search across the published corpus, jump to deep dives, and test content breadth.",
        to: "/explore",
        action: "Browse library",
      },
      {
        label: "Families",
        title: "Study-family rails",
        description: "Inspect how the corpus clusters into learning lanes instead of a flat term list.",
        to: "/families",
        action: "Browse families",
      },
      {
        label: "Paths",
        title: "Guided trails",
        description: "Check whether learning paths feel sequenced, not just categorized.",
        to: samplePath ? `/paths/${samplePath.slug}` : "/paths",
        action: samplePath ? "Open sample trail" : "Browse paths",
      },
      {
        label: "Deep dive",
        title: "Term detail and study loop",
        description:
          "Exercise blocks, bookmarking, notes, annotation, sharing, and export from one concept surface.",
        to: sampleInteractiveTerm ? `/term/${sampleInteractiveTerm.slug}` : "/explore",
        action: sampleInteractiveTerm ? "Open sample term" : "Browse terms",
      },
      {
        label: "Memory",
        title: "Saved shelf and notebook",
        description: "Verify that memory tools feel central to the product instead of buried utilities.",
        to: "/saved",
        action: "Open shelf",
      },
      {
        label: "Account",
        title: "Membership and profile",
        description: "Confirm the premium promise and learner identity flow are visible and coherent.",
        to: "/account",
        action: "Open profile",
      },
      {
        label: "QA",
        title: "Field lab",
        description:
          "Stay on this surface to inspect routes, structures, features, and direct term access together.",
        to: "/field-lab",
        action: "Stay in lab",
      },
    ],
    [sampleInteractiveTerm, samplePath],
  );

  const featureChecks = useMemo(
    () => [
      {
        label: "Bookmark loop",
        description:
          "Open a term, bookmark it, then confirm shelf counts and continue-learning cards update.",
        to: sampleFeaturedTerm ? `/term/${sampleFeaturedTerm.slug}` : "/explore",
        action: "Test bookmarks",
      },
      {
        label: "Notebook loop",
        description: "Write a note on a term, then verify the note summary and notes workspace reflect it.",
        to: "/notes",
        action: "Open notes",
      },
      {
        label: "Share and export",
        description: "Use a term page to exercise canonical share links and JSON export packets.",
        to: sampleInteractiveTerm ? `/term/${sampleInteractiveTerm.slug}` : "/explore",
        action: "Open exportable term",
      },
      {
        label: "Path memory",
        description: "Open a trail, come back here, and verify resume-path memory appears immediately.",
        to: samplePath ? `/paths/${samplePath.slug}` : "/paths",
        action: "Test path memory",
      },
    ],
    [sampleFeaturedTerm, sampleInteractiveTerm, samplePath],
  );

  const blockCoverage = useMemo(() => {
    const entries = Object.entries(manifest?.contentDepth?.blockCounts ?? {});
    return entries.sort((left, right) => right[1] - left[1]);
  }, [manifest]);

  const systemStats = [
    {
      label: "Published corpus",
      value: manifest ? manifest.termCount.toLocaleString() : terms.length.toLocaleString(),
      note: "terms ready to inspect",
    },
    {
      label: "Guided trails",
      value: manifest ? manifest.pathCount.toLocaleString() : paths.length.toLocaleString(),
      note: "paths ready to inspect",
    },
    {
      label: "Study memory",
      value: bookmarks.length.toLocaleString(),
      note: "saved terms in the current workspace",
    },
    {
      label: "Notebook",
      value: noteCount.toLocaleString(),
      note: "notes already present here",
    },
  ];

  return (
    <DirectionalTransition>
    <section className="page-grid field-lab-page">
      <section className="hero-card field-lab-hero">
        <div className="field-lab-hero-copy">
          <p className="eyebrow">Field lab</p>
          <h2>Inspect the product as a working system, not a gallery of cards.</h2>
          <p className="hero-lead">
            Routes, corpus depth, path coverage, editorial structure, and study memory should all be
            visible from one place. The field lab exists so we can audit the product without losing the
            shape of the product.
          </p>
          <div className="field-lab-stat-strip">
            {systemStats.map((stat) => (
              <article key={stat.label} className="field-lab-stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <p>{stat.note}</p>
              </article>
            ))}
          </div>
          <div className="hero-actions">
            <Button variant="accent" asChild>
              <Link to="/explore">Open full library</Link>
            </Button>
            <Button variant="raised" asChild>
              <Link to={sampleInteractiveTerm ? `/term/${sampleInteractiveTerm.slug}` : "/explore"}>
                Open sample deep dive
              </Link>
            </Button>
            <Button variant="raised" asChild>
              <Link to={samplePath ? `/paths/${samplePath.slug}` : "/paths"}>
                Open sample trail
              </Link>
            </Button>
          </div>
        </div>
        <div className="field-lab-hero-panels">
          <article className="field-lab-status-panel field-lab-status-panel-primary">
            <p className="showcase-label">Coverage snapshot</p>
            <h3>
              {manifest
                ? `${manifest.launchSectionCount} launch sections, ${manifest.structureSectionCount} editorial sections`
                : "Loading coverage snapshot…"}
            </h3>
            <p>
              This view shows what is live now, what the editorial plan still covers, and where the
              published product has room to grow.
            </p>
            {error ? (
              <div className="field-lab-error-block">
                <p>{error}</p>
                <Button variant="raised" size="sm" onClick={reloadCatalog}>
                  Retry catalog
                </Button>
              </div>
            ) : null}
            <div className="field-lab-mini-grid">
              <div>
                <strong>{routeSurfaces.length}</strong>
                <span>route checks</span>
              </div>
              <div>
                <strong>{featureChecks.length}</strong>
                <span>feature loops</span>
              </div>
              <div>
                <strong>{blockCoverage.length || "—"}</strong>
                <span>block families</span>
              </div>
              <div>
                <strong>{topFamilies[0]?.[0] ?? "—"}</strong>
                <span>top family</span>
              </div>
            </div>
          </article>
          <article className="field-lab-status-panel field-lab-status-panel-dark">
            <p className="showcase-label">Top study families</p>
            <div className="field-lab-family-list">
              {topFamilies.map(([label, count]) => (
                <div key={label}>
                  <strong>{label}</strong>
                  <span>{count.toLocaleString()} terms</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="field-lab-section">
        <div className="section-header">
          <p className="eyebrow">Inspection lanes</p>
          <h2>Keep the system readable through a few strong lanes.</h2>
          <p>
            The field lab should not feel like a dump of components. It should feel like a controlled
            room where the important rails are obvious and the supporting details are available on
            demand.
          </p>
        </div>
        <div className="field-lab-lane-grid">
          <article className="field-lab-lane-card">
            <p className="showcase-label">Route map</p>
            <h3>Every major surface should stay one click away.</h3>
            <div className="field-lab-link-list">
              {routeSurfaces.slice(0, 4).map((surface) => (
                <Link key={surface.title} className="field-lab-link-row" to={surface.to}>
                  <span>{surface.label}</span>
                  <strong>{surface.action}</strong>
                </Link>
              ))}
            </div>
          </article>
          <article className="field-lab-lane-card">
            <p className="showcase-label">Core loops</p>
            <h3>Bookmarks, notes, sharing, and path memory should be proofable.</h3>
            <div className="field-lab-link-list">
              {featureChecks.map((feature) => (
                <Link key={feature.label} className="field-lab-link-row" to={feature.to}>
                  <span>{feature.label}</span>
                  <strong>{feature.action}</strong>
                </Link>
              ))}
            </div>
          </article>
          <article className="field-lab-lane-card">
            <p className="showcase-label">Corpus depth</p>
            <h3>Published content should explain itself without extra tabs.</h3>
            <div className="field-lab-mini-grid field-lab-mini-grid-compact">
              {systemStats.slice(0, 2).map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="field-lab-family-list field-lab-family-list-compact">
              {topFamilies.slice(0, 4).map(([label, count]) => (
                <div key={label}>
                  <strong>{label}</strong>
                  <span>{count.toLocaleString()} terms</span>
                </div>
              ))}
            </div>
          </article>
          <article className="field-lab-lane-card">
            <p className="showcase-label">Runtime contract</p>
            <h3>Keep the runtime contract readable without repeating every number twice.</h3>
            <p>
              The launch contract, structure registry, and published corpus should stay inspectable,
              but they do not all need to shout the same metrics on the same screen.
            </p>
            <div className="field-lab-contract-summary">
              <div>
                <strong>Launch mapped</strong>
                <span>{launchContract ? "Source sections are linked to the runtime" : "Loading launch contract…"}</span>
              </div>
              <div>
                <strong>Structure held</strong>
                <span>{registry ? "Editorial ceiling stays explicit" : "Loading structure…"}</span>
              </div>
            </div>
            <Button variant="link" asChild><Link to="/field-lab">
              Stay in the inspector
            </Link></Button>
          </article>
        </div>
      </section>

      <FieldLabTermInspection terms={terms} isLoading={isLoading} error={error} />
    </section>
    </DirectionalTransition>
  );
}
