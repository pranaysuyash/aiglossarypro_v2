import { useEffect, useState } from "react";
import { loadPublishedCorpusManifest, type PublishedCorpusManifest } from "../../../content/publishedManifest";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function LearningAtlasCard() {
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

  const runtime = manifest?.structureLayerCounts["launch-runtime"] ?? 0;
  const editorial = manifest?.structureLayerCounts["editorial-expansion"] ?? 0;
  const backlog = manifest?.structureLayerCounts.backlog ?? 0;
  const totalStructure = runtime + editorial + backlog || 1;

  return (
    <article className="learning-atlas-card">
      <p className="showcase-label">Corpus atlas</p>
      <h3>{manifest ? `${manifest.termCount.toLocaleString()} terms in one study graph` : "Loading atlas…"}</h3>
      <p>
        The product is built from JSON artifacts, but the learning experience still needs to feel
        alive, visual, and easy to enter. This atlas keeps the corpus readable at a glance.
      </p>
      <div className="atlas-bar" aria-label="Structure layers">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="atlas-layer atlas-layer-runtime"
                style={{ width: `${(runtime / totalStructure) * 100}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>{`Launch runtime: ${runtime} fields`}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="atlas-layer atlas-layer-editorial"
                style={{ width: `${(editorial / totalStructure) * 100}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>{`Editorial expansion: ${editorial} fields`}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="atlas-layer atlas-layer-backlog"
                style={{ width: `${(backlog / totalStructure) * 100}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>{`Backlog: ${backlog} fields`}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="atlas-stats">
        <span>{manifest ? `${manifest.pathCount.toLocaleString()} paths` : "Paths"}</span>
        <span>{manifest ? `${manifest.launchSectionCount} launch sections` : "Launch"}</span>
        <span>{manifest ? formatPercent(manifest.coverage.taxonomyCoverageRatio) : "Coverage"}</span>
      </div>
      <div className="atlas-grid">
        <div>
          <strong>{manifest ? manifest.coverage.definitionTerms.toLocaleString() : "—"}</strong>
          <span>source-backed definitions</span>
        </div>
        <div>
          <strong>{manifest ? manifest.coverage.studyFamilyTerms.toLocaleString() : "—"}</strong>
          <span>study-family terms</span>
        </div>
        <div>
          <strong>{manifest ? manifest.canonicalization.rowsMerged.toLocaleString() : "—"}</strong>
          <span>duplicate rows merged</span>
        </div>
        <div>
          <strong>
            {manifest ? (manifest.contentDepth?.blockCounts["curriculum-map"] ?? 0).toLocaleString() : "—"}
          </strong>
          <span>curriculum maps</span>
        </div>
        <div>
          <strong>
            {manifest ? (manifest.contentDepth?.blockCounts["structure-expansion"] ?? 0).toLocaleString() : "—"}
          </strong>
          <span>structure expansions</span>
        </div>
      </div>
      <p className="atlas-footnote">
        {manifest
          ? `Manifest status: ${manifest.status}. The corpus is measurable, source-traceable, and ready for a richer consumer-facing study surface.`
          : "The manifest is loading from published JSON."}
      </p>
    </article>
  );
}
