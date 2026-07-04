import { useEffect, useState } from "react";
import { loadPublishedCorpusManifest, type PublishedCorpusManifest } from "../../../content/publishedManifest";

export function LaunchCurriculumPreview() {
  const [manifest, setManifest] = useState<PublishedCorpusManifest | null>(null);

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
        <p className="showcase-label">Launch curriculum</p>
        <h3>What the first release should cover well</h3>
        <p>
          The editorial plan now has a published launch contract so the app knows which parts belong
          in the current runtime and which ones stay in expansion mode.
        </p>
        <div className="note-snippet-list">
          <span>{manifest ? `${manifest.launchSectionCount} launch sections` : "Loading launch sections…"}</span>
          <span>{manifest ? `${manifest.structureLayerCounts["launch-runtime"]} runtime fields` : "JSON-backed"}</span>
          <span>{manifest ? `${manifest.structureLayerCounts.backlog} backlog fields` : "Structure-aware"}</span>
        </div>
      </article>
      <article className="summary-card">
        <p className="showcase-label">Runtime blocks</p>
        <h3>Compact by design</h3>
        <p>
          The launch surface stays centered on a small, consistent block set instead of mirroring the
          whole editorial plan, while every published term also carries a curriculum-map block derived
          from the launch contract.
        </p>
        <div className="shelf-links">
          {(manifest?.launchBlockIds ?? ["overview", "taxonomy", "connections", "study-prompts"]).map((blockId) => (
            <span key={blockId}>{blockId}</span>
          ))}
        </div>
      </article>
      <article className="summary-card">
        <p className="showcase-label">Launch sections</p>
        <h3>Mapped from the source plan, not invented twice</h3>
        <div className="note-snippet-list">
          {(manifest?.launchSections ?? []).slice(0, 6).map((item) => (
            <span key={item.section}>
              {item.section}
            </span>
          ))}
        </div>
        <p className="term-metrics">
          {manifest
            ? `Current launch contract keeps ${manifest.structureLayerCounts["launch-runtime"]} runtime fields visible, publishes curriculum maps for every term, and promotes ${manifest.contentDepth?.blockCounts["structure-expansion"] ?? 0} featured structure expansions.`
            : "The launch contract is loading from published JSON."}
        </p>
      </article>
    </section>
  );
}
