import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="metric">{manifest ? `${manifest.launchSectionCount} launch sections` : "Loading launch sections…"}</Badge>
          <Badge variant="metric">{manifest ? `${manifest.structureLayerCounts["launch-runtime"]} runtime fields` : "JSON-backed"}</Badge>
          <Badge variant="metric">{manifest ? `${manifest.structureLayerCounts.backlog} backlog fields` : "Structure-aware"}</Badge>
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
        <div className="flex flex-wrap gap-2">
          {(manifest?.launchBlockIds ?? ["overview", "taxonomy", "connections", "study-prompts"]).map((blockId) => (
            <Badge key={blockId} variant="metric">{blockId}</Badge>
          ))}
        </div>
      </article>
      <article className="summary-card">
        <p className="showcase-label">Launch sections</p>
        <h3>Mapped from the source plan, not invented twice</h3>
        <div className="flex flex-wrap gap-2">
          {(manifest?.launchSections ?? []).slice(0, 6).map((item) => (
            <Badge key={item.section} variant="metric">
              {item.section}
            </Badge>
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
