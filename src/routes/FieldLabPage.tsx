import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ContinueLearningCard } from "../components/ContinueLearningCard";
import { ContinuePathCard } from "../components/ContinuePathCard";
import { LearningAtlasCard } from "../components/LearningAtlasCard";
import { RecentActivityCard } from "../components/RecentActivityCard";
import { StructureExplorerCard } from "../components/StructureExplorerCard";
import { StudyMemoryCard } from "../components/StudyMemoryCard";
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

const pageSize = 24;

export function FieldLabPage() {
  const { terms, paths, isLoading, error } = useCatalog();
  const { bookmarks, notes } = useStudy();
  const [manifest, setManifest] = useState<PublishedCorpusManifest | null>(null);
  const [registry, setRegistry] = useState<PublishedStructureRegistry | null>(null);
  const [launchContract, setLaunchContract] = useState<PublishedLaunchContract | null>(null);
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "featured" | "standard" | "sparse">("all");
  const [pageIndex, setPageIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

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

  useEffect(() => {
    setPageIndex(0);
  }, [deferredQuery, tierFilter]);

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

  const filteredTerms = useMemo(() => {
    const searchKey = deferredQuery.trim().toLowerCase();
    return terms.filter((term) => {
      if (tierFilter !== "all" && term.metadata.editorialTier !== tierFilter) {
        return false;
      }
      if (!searchKey) {
        return true;
      }
      return [
        term.title,
        term.summary,
        term.taxonomy.topic,
        term.taxonomy.category,
        term.taxonomy.subCategory,
        term.metadata.studyFamily ?? "",
        ...term.aliases,
        ...term.taxonomy.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchKey);
    });
  }, [deferredQuery, terms, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTerms.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleTerms = filteredTerms.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

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
        action: "Open library",
      },
      {
        label: "Families",
        title: "Study-family rails",
        description: "Inspect how the corpus clusters into learning lanes instead of a flat term list.",
        to: "/families",
        action: "Open families",
      },
      {
        label: "Paths",
        title: "Guided trails",
        description: "Check whether learning paths feel sequenced, not just categorized.",
        to: samplePath ? `/paths/${samplePath.slug}` : "/paths",
        action: samplePath ? "Open sample path" : "Open paths",
      },
      {
        label: "Deep dive",
        title: "Term detail and study loop",
        description: "Exercise blocks, bookmarking, notes, annotation, sharing, and export from one concept surface.",
        to: sampleInteractiveTerm ? `/term/${sampleInteractiveTerm.slug}` : "/explore",
        action: sampleInteractiveTerm ? "Open sample term" : "Open a term",
      },
      {
        label: "Memory",
        title: "Saved shelf and notebook",
        description: "Verify that memory tools feel central to the product instead of buried utilities.",
        to: "/saved",
        action: "Open saved terms",
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
        description: "Stay on this surface to inspect routes, structures, features, and direct term access together.",
        to: "/field-lab",
        action: "Stay in lab",
      },
    ],
    [sampleInteractiveTerm, samplePath],
  );

  const featureChecks = [
    {
      label: "Bookmark loop",
      description: "Open a term, bookmark it, then confirm shelf counts and continue-learning cards update.",
      to: sampleFeaturedTerm ? `/term/${sampleFeaturedTerm.slug}` : "/explore",
      action: "Test bookmarks",
    },
    {
      label: "Notebook loop",
      description: "Write a note on a term, then verify the note summary and notes workspace reflect it.",
      to: "/notes",
      action: "Open notebook",
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
  ];

  const blockCoverage = useMemo(() => {
    const entries = Object.entries(manifest?.contentDepth?.blockCounts ?? {});
    return entries.sort((left, right) => right[1] - left[1]);
  }, [manifest]);

  const layerGroups = useMemo(() => {
    const list = registry?.sectionGroups ?? [];
    return {
      "launch-runtime": list.filter((group) => group.layer === "launch-runtime").slice(0, 8),
      "editorial-expansion": list.filter((group) => group.layer === "editorial-expansion").slice(0, 8),
      backlog: list.filter((group) => group.layer === "backlog").slice(0, 8),
    };
  }, [registry]);

  return (
    <section className="page-grid field-lab-page">
      <section className="hero-card field-lab-hero">
        <div className="field-lab-hero-copy">
          <p className="eyebrow">Field lab</p>
          <h2>Inspect the whole product from one dense surface.</h2>
          <p className="hero-lead">
            Routes, terms, path coverage, content blocks, editorial structure, and study-memory
            features should all be testable without wandering blindly through the app.
          </p>
          <div className="field-lab-metric-grid">
            <article className="field-lab-metric-card">
              <span>Published corpus</span>
              <strong>{manifest ? manifest.termCount.toLocaleString() : terms.length.toLocaleString()}</strong>
              <p>terms available to inspect</p>
            </article>
            <article className="field-lab-metric-card">
              <span>Guided trails</span>
              <strong>{manifest ? manifest.pathCount.toLocaleString() : paths.length.toLocaleString()}</strong>
              <p>paths available to inspect</p>
            </article>
            <article className="field-lab-metric-card">
              <span>Study memory</span>
              <strong>{bookmarks.length.toLocaleString()}</strong>
              <p>saved terms across the local study loop</p>
            </article>
            <article className="field-lab-metric-card">
              <span>Notebook</span>
              <strong>{noteCount.toLocaleString()}</strong>
              <p>notes already present in the current workspace</p>
            </article>
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to="/explore">
              Open full library
            </Link>
            <Link className="ghost-button" to={sampleInteractiveTerm ? `/term/${sampleInteractiveTerm.slug}` : "/explore"}>
              Open sample deep dive
            </Link>
            <Link className="ghost-button" to={samplePath ? `/paths/${samplePath.slug}` : "/paths"}>
              Open sample trail
            </Link>
          </div>
        </div>
        <div className="field-lab-hero-panels">
          <article className="field-lab-status-panel">
            <p className="showcase-label">Coverage snapshot</p>
            <h3>
              {manifest
                ? `${manifest.launchSectionCount} launch sections, ${manifest.structureSectionCount} editorial sections`
                : "Loading coverage snapshot"}
            </h3>
            <p>
              The app already knows what exists in the source workbooks. The job of this surface is
              to make that knowledge inspectable.
            </p>
            <div className="field-lab-chip-row">
              <span>{routeSurfaces.length} route checks</span>
              <span>{featureChecks.length} feature loops</span>
              <span>{blockCoverage.length || "—"} block families</span>
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
          <p className="eyebrow">Route coverage</p>
          <h2>Every major surface should be one click away.</h2>
          <p>
            This turns the app into a product you can audit systematically instead of exploring by
            memory.
          </p>
        </div>
        <div className="field-lab-route-grid">
          {routeSurfaces.map((surface) => (
            <article key={surface.title} className="field-lab-route-card">
              <p className="showcase-label">{surface.label}</p>
              <h3>{surface.title}</h3>
              <p>{surface.description}</p>
              <Link className="text-link" to={surface.to}>
                {surface.action}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="field-lab-section">
        <div className="section-header">
          <p className="eyebrow">Feature loops</p>
          <h2>Core study behaviors need explicit proof paths.</h2>
          <p>
            Bookmarking, notes, sharing, export, and path memory are product features, not hidden
            implementation details.
          </p>
        </div>
        <div className="field-lab-route-grid">
          {featureChecks.map((feature) => (
            <article key={feature.label} className="field-lab-route-card">
              <p className="showcase-label">{feature.label}</p>
              <h3>{feature.action}</h3>
              <p>{feature.description}</p>
              <Link className="text-link" to={feature.to}>
                Start check
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="field-lab-section">
        <div className="section-header">
          <p className="eyebrow">Live component deck</p>
          <h2>Key cards should be inspectable in one place, not scattered across the home page.</h2>
        </div>
        <div className="field-lab-component-grid field-lab-component-grid-wide">
          <LearningAtlasCard />
          <StructureExplorerCard />
        </div>
        <div className="field-lab-component-grid">
          <ContinueLearningCard />
          <ContinuePathCard />
          <RecentActivityCard />
          <StudyMemoryCard />
        </div>
      </section>

      <section className="field-lab-section">
        <div className="section-header">
          <p className="eyebrow">Content depth</p>
          <h2>The corpus should show its runtime blocks and editorial contract directly.</h2>
          <p>
            This is where we test whether the content model is rich enough to support a serious
            learning product.
          </p>
        </div>
        <div className="field-lab-block-grid">
          {blockCoverage.map(([blockType, count]) => (
            <article key={blockType} className="field-lab-block-card">
              <p className="showcase-label">{blockType}</p>
              <strong>{count.toLocaleString()}</strong>
              <span>published blocks</span>
            </article>
          ))}
        </div>
      </section>

      <section className="field-lab-section field-lab-grid-2">
        <article className="summary-card field-lab-contract-card">
          <p className="eyebrow">Launch contract</p>
          <h3>
            {launchContract
              ? `${launchContract.launchSectionCount} source sections mapped to the launch runtime`
              : "Loading launch contract"}
          </h3>
          <div className="field-lab-contract-list">
            {(launchContract?.launchSections ?? []).slice(0, 8).map((section) => (
              <div key={section.section} className="field-lab-contract-item">
                <strong>{section.section}</strong>
                <span>{section.status}</span>
                <p>{section.note}</p>
                <div className="field-lab-chip-row">
                  {section.runtimeBlocks.map((block) => (
                    <span key={block}>{block}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="summary-card field-lab-contract-card">
          <p className="eyebrow">Editorial structure</p>
          <h3>
            {registry ? `${registry.fieldCount} workbook fields partitioned by product layer` : "Loading structure registry"}
          </h3>
          <div className="field-lab-layer-columns">
            {(["launch-runtime", "editorial-expansion", "backlog"] as const).map((layer) => (
              <section key={layer} className={`field-lab-layer-column field-lab-layer-column-${layer}`}>
                <div className="field-lab-layer-head">
                  <strong>{layer}</strong>
                  <span>{registry ? registry.layerCounts[layer].toLocaleString() : "—"} fields</span>
                </div>
                {layerGroups[layer].map((group) => (
                  <div key={`${layer}-${group.section}`} className="field-lab-layer-group">
                    <strong>{group.section}</strong>
                    <span>{group.fieldCount} fields</span>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </article>
      </section>

      <section className="field-lab-section">
        <div className="section-header">
          <p className="eyebrow">Term inspection</p>
          <h2>Search, filter, and jump directly into any live part of the corpus.</h2>
          <p>
            This is the practical answer to “can I test every term?” without rendering 17,988 cards
            at once.
          </p>
        </div>
        <div className="field-lab-term-controls">
          <label className="search-panel search-panel-large">
            <span>Search terms, families, aliases, tags, categories</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: transformer, rag, evaluation, active learning, alignment..."
            />
          </label>
          <label className="field-lab-select">
            <span>Tier filter</span>
            <select value={tierFilter} onChange={(event) => setTierFilter(event.target.value as typeof tierFilter)}>
              <option value="all">All terms</option>
              <option value="featured">Featured</option>
              <option value="standard">Standard</option>
              <option value="sparse">Sparse</option>
            </select>
          </label>
        </div>
        <article className="summary-card field-lab-search-status">
          <h3>
            {filteredTerms.length.toLocaleString()} matching terms
            {isLoading ? " (catalog loading)" : ""}
          </h3>
          <p>
            {error
              ? error
              : deferredQuery.trim()
                ? `Showing terms matching "${deferredQuery.trim()}" with the current tier filter.`
                : "Showing the current corpus through a paged inspection surface instead of an endless render."}
          </p>
          <div className="field-lab-pagination">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <span>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setPageIndex((value) => Math.min(totalPages - 1, value + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </article>
        <div className="field-lab-term-grid">
          {visibleTerms.map((term) => (
            <article key={term.slug} className="field-lab-term-card">
              <div className="field-lab-term-head">
                <span className={`term-tier term-tier-${term.metadata.editorialTier ?? "standard"}`}>
                  {term.metadata.editorialTier ?? "standard"}
                </span>
                <p className="term-taxonomy">
                  {term.taxonomy.category} / {term.taxonomy.subCategory}
                </p>
              </div>
              <h3>{term.title}</h3>
              <p>{term.summary}</p>
              <div className="field-lab-chip-row">
                <span>{term.aliases.length} aliases</span>
                <span>{term.metadata.studyFamily || "No family"}</span>
                <span>Shard {term.artifact.shardId}</span>
              </div>
              <Link className="text-link" to={`/term/${term.slug}`}>
                Open term detail
              </Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
