import { useEffect, useState } from "react";
import { loadPublishedCorpusManifest, type PublishedCorpusManifest } from "../content/publishedManifest";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function CorpusProgressPreview() {
  const [manifest, setManifest] = useState<PublishedCorpusManifest | null>(null);
  const runtime = manifest?.structureLayerCounts["launch-runtime"] ?? 0;
  const editorial = manifest?.structureLayerCounts["editorial-expansion"] ?? 0;
  const backlog = manifest?.structureLayerCounts.backlog ?? 0;
  const totalStructure = runtime + editorial + backlog || 1;
  const featuredTerms = manifest?.contentTierCounts.featured ?? 0;
  const standardTerms = manifest?.contentTierCounts.standard ?? 0;
  const sparseTerms = manifest?.contentTierCounts.sparse ?? 0;
  const totalTiers = featuredTerms + standardTerms + sparseTerms || 1;
  const blockCounts = manifest?.contentDepth?.blockCounts ?? {};
  const deepDiveCount = blockCounts["deep-dive"] ?? 0;
  const quickQuizCount = blockCounts["quick-quiz"] ?? 0;
  const conceptMapCount = blockCounts["concept-map"] ?? 0;
  const quickFaqCount = blockCounts["quick-faq"] ?? 0;
  const curriculumMapCount = blockCounts["curriculum-map"] ?? 0;
  const structureExpansionCount = blockCounts["structure-expansion"] ?? 0;
  const featuredStudyNodes = manifest?.contentDepth?.featuredTermCount ?? 0;
  const learningModes = [
    {
      title: "At a glance",
      note: "Fast orientation with taxonomy, source trace, and study-family cues.",
    },
    {
      title: "Concept map",
      note: "Prerequisites, neighbors, and next concepts in one visual move.",
    },
    {
      title: "Quick FAQ",
      note: "Compact question-and-answer reinforcement for memory refresh.",
    },
    {
      title: "Quick quiz",
      note: "A one-question self-check that reveals the answer and explains why.",
    },
    {
      title: "Featured deep dive",
      note: "Richer infographic-style treatment for stronger concepts and path anchors.",
    },
    {
      title: "Curriculum map",
      note: "The workbook structure rendered as a visible learning arc on every term.",
    },
    {
      title: "Structure expansion",
      note: "Broader editorial and backlog layers promoted on featured concepts.",
    },
  ];

  useEffect(() => {
    let isCancelled = false;

    async function loadManifest() {
      const payload = await loadPublishedCorpusManifest();
      if (!isCancelled) {
        setManifest(payload);
      }
    }

    void loadManifest();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <section className="workspace-hero">
      <article className="summary-card">
        <p className="showcase-label">Learning depth atlas</p>
        <h3>{manifest ? `${manifest.termCount.toLocaleString()} terms in the live library` : "Loading corpus atlas"}</h3>
        <p>
          The corpus is JSON-first and rechecked at build time, so the app can stay honest about
          where every term gets the compact launch stack and where richer study treatment is earned.
        </p>
        <div className="content-depth-orbit" aria-label="Corpus layer balance">
          <div className="content-depth-orbit-center">
            <strong>{manifest ? `${manifest.pathCount.toLocaleString()}` : "—"}</strong>
            <span>guided paths</span>
          </div>
          <div className="content-depth-orbit-ring content-depth-orbit-runtime" style={{ width: `${(runtime / totalStructure) * 100}%` }} title="Launch runtime" />
          <div className="content-depth-orbit-ring content-depth-orbit-editorial" style={{ width: `${(editorial / totalStructure) * 100}%` }} title="Editorial expansion" />
          <div className="content-depth-orbit-ring content-depth-orbit-backlog" style={{ width: `${(backlog / totalStructure) * 100}%` }} title="Backlog" />
        </div>
        <div className="depth-snippet-grid">
          <span>
            {manifest ? `${manifest.coverage.definitionTerms.toLocaleString()} source-backed definitions` : "Definition coverage"}
          </span>
          <span>
            {manifest ? `${manifest.coverage.taxonomyTerms.toLocaleString()} taxonomy-linked terms` : "Taxonomy coverage"}
          </span>
          <span>
            {manifest ? `${manifest.coverage.studyFamilyTerms.toLocaleString()} study-family terms` : "Study-family coverage"}
          </span>
          <span>
            {manifest ? `${manifest.coverage.blockCoverage["study-prompts"]} study prompts` : "Study prompts"}
          </span>
        </div>
        <div className="depth-snippet-grid">
          <span>{manifest ? `${quickQuizCount.toLocaleString()} quick quizzes` : "Quick quizzes"}</span>
          <span>{manifest ? `${conceptMapCount.toLocaleString()} concept maps` : "Concept maps"}</span>
          <span>{manifest ? `${quickFaqCount.toLocaleString()} quick FAQs` : "Quick FAQs"}</span>
          <span>{manifest ? `${deepDiveCount.toLocaleString()} featured deep dives` : "Featured deep dives"}</span>
          <span>{manifest ? `${curriculumMapCount.toLocaleString()} curriculum maps` : "Curriculum maps"}</span>
          <span>{manifest ? `${structureExpansionCount.toLocaleString()} structure expansions` : "Structure expansions"}</span>
        </div>
      </article>
      <article className="summary-card">
        <p className="showcase-label">What the structure means</p>
        <h3>Universal learning blocks first. Richer editorial layers where the signal deserves it.</h3>
        <p className="term-metrics">
          {manifest
            ? "Every term gets the compact launch stack. Featured concepts get the infographic-style deep dives, while sparse entries stay visible without pretending to be fully authored."
            : "The current corpus manifest is loading from published JSON."}
        </p>
        <div className="depth-grid">
          <div>
            <strong>{manifest ? `${manifest.termCount.toLocaleString()}` : "—"}</strong>
            <span>terms in the live corpus</span>
          </div>
          <div>
            <strong>{manifest ? `${manifest.coverage.definitionTerms.toLocaleString()}` : "—"}</strong>
            <span>terms with source-backed definitions</span>
          </div>
          <div>
            <strong>{manifest ? `${manifest.coverage.taxonomyTerms.toLocaleString()}` : "—"}</strong>
            <span>terms with taxonomy coverage</span>
          </div>
          <div>
            <strong>{manifest ? featuredStudyNodes.toLocaleString() : "—"}</strong>
            <span>featured study nodes</span>
          </div>
        </div>
        <div className="depth-tier-stack" aria-label="Editorial depth tiers">
          <span className="depth-tier depth-tier-featured" style={{ width: `${(featuredTerms / totalTiers) * 100}%` }}>
            Featured {manifest ? formatPercent(featuredTerms / totalTiers) : ""}
          </span>
          <span className="depth-tier depth-tier-standard" style={{ width: `${(standardTerms / totalTiers) * 100}%` }}>
            Standard {manifest ? formatPercent(standardTerms / totalTiers) : ""}
          </span>
          <span className="depth-tier depth-tier-sparse" style={{ width: `${(sparseTerms / totalTiers) * 100}%` }}>
            Sparse {manifest ? formatPercent(sparseTerms / totalTiers) : ""}
          </span>
        </div>
      </article>
      <article className="summary-card">
        <p className="showcase-label">Interactive layer</p>
        <h3>Quizzes, diagrams, and memory tools belong in the product, not an appendix.</h3>
        <p>
          The base runtime already supports compact recall blocks, visual concept maps, FAQ-style
          reinforcement, bookmarking, notes, annotations, sharing, and exportable study packets.
          That is how the app stays interactive without becoming a bloated CMS.
        </p>
        <div className="learning-mode-grid">
          {learningModes.map((mode) => (
            <article key={mode.title} className="learning-mode-card">
              <h4>{mode.title}</h4>
              <p>{mode.note}</p>
            </article>
          ))}
        </div>
      </article>
      <article className="summary-card">
        <p className="showcase-label">Where richer content goes next</p>
        <h3>Featured concepts should get the visual treatment.</h3>
        <ul className="depth-priority-list">
          <li>Foundational clusters that anchor the rest of the catalog</li>
          <li>High-confusion concepts that benefit from diagrams and recall drills</li>
          <li>Path headers and landing surfaces that need stronger infographic proof</li>
          <li>Comparisons, edge cases, and “why this matters” views for paid members</li>
        </ul>
        <div className="shelf-links">
          <span>{manifest ? `${manifest.coverage.blockCoverage.overview} overview blocks` : "Overview"}</span>
          <span>{manifest ? `${manifest.coverage.blockCoverage.connections} connection blocks` : "Connections"}</span>
          <span>{manifest ? `${manifest.coverage.blockCoverage["study-prompts"]} study prompts` : "Study prompts"}</span>
        </div>
      </article>
    </section>
  );
}
