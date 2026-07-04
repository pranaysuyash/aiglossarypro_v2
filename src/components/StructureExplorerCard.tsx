import { useEffect, useMemo, useState } from "react";
import { loadPublishedStructureRegistry, type PublishedStructureRegistry } from "../content/structureRegistry";

type LayerKey = "launch-runtime" | "editorial-expansion" | "backlog";

export function StructureExplorerCard() {
  const [registry, setRegistry] = useState<PublishedStructureRegistry | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadRegistry() {
      const payload = await loadPublishedStructureRegistry();
      if (!isCancelled) {
        setRegistry(payload);
      }
    }

    void loadRegistry();
    return () => {
      isCancelled = true;
    };
  }, []);

  const layerGroups = useMemo(() => {
    const groupByLayer = (layer: LayerKey) =>
      registry?.sectionGroups.filter((group) => group.layer === layer).slice(0, 4) ?? [];
    return {
      "launch-runtime": groupByLayer("launch-runtime"),
      "editorial-expansion": groupByLayer("editorial-expansion"),
      backlog: groupByLayer("backlog"),
    };
  }, [registry]);

  return (
    <article className="structure-explorer-card">
      <p className="showcase-label">Curriculum blueprint</p>
      <h3>{registry ? `${registry.fieldCount} workbook fields, one layered product` : "Loading structure map…"}</h3>
      <p>
        The workbook is not treated as one giant schema. It is split into launch runtime, editorial
        expansion, and backlog so the app can stay lean while still knowing exactly what exists.
      </p>
      <div className="structure-layers">
        {( ["launch-runtime", "editorial-expansion", "backlog"] as LayerKey[] ).map((layer) => {
          const groups = layerGroups[layer];
          return (
            <section key={layer} className={`structure-layer structure-layer-${layer}`}>
              <div className="structure-layer-head">
                <strong>{layer}</strong>
                <span>{registry ? `${registry.layerCounts[layer]} fields` : "Loading…"}</span>
              </div>
              <div className="structure-layer-bar" aria-hidden="true">
                <div
                  className="structure-layer-fill"
                  style={{
                    width: registry
                      ? `${(registry.layerCounts[layer] / registry.fieldCount) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="structure-section-chips">
                {groups.map((group) => (
                  <span key={group.section}>{group.section}</span>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="structure-explorer-footnote">
        {registry
          ? `The launch contract covers ${registry.launchSections.length} sections and the rest remains explicitly partitioned instead of hidden.`
          : "The structure registry is loading from published JSON."}
      </p>
    </article>
  );
}
