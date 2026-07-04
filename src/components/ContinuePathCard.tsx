import { Link } from "react-router-dom";
import { useCatalog } from "../content/CatalogContext";
import { loadLastOpenedPathSlug } from "../study/storage";
import { useEffect, useState } from "react";

export function ContinuePathCard() {
  const { pathMap, paths } = useCatalog();
  const [lastPathSlug, setLastPathSlug] = useState<string | null>(null);

  useEffect(() => {
    setLastPathSlug(loadLastOpenedPathSlug());
  }, []);

  const lastPath = lastPathSlug ? pathMap.get(lastPathSlug) ?? null : null;
  const firstPath = paths[0] ?? null;

  return (
    <article className="continue-path-card">
      <p className="showcase-label">Continue a path</p>
      <h3>{lastPath ? lastPath.title : "Resume a learning trail"}</h3>
      <p>
        {lastPath
          ? `You last opened ${lastPath.title}, so we can take you back there immediately.`
          : "Open a path and the home page will remember it here on the next visit."}
      </p>
      <div className="continue-grid">
        <div>
          <strong>{lastPath ? lastPath.termCount : 0}</strong>
          <span>terms in trail</span>
        </div>
        <div>
          <strong>{lastPath ? lastPath.featuredTermSlugs.length : 0}</strong>
          <span>featured steps</span>
        </div>
        <div>
          <strong>{firstPath ? firstPath.category : "—"}</strong>
          <span>first path category</span>
        </div>
      </div>
      <div className="hero-actions">
        <Link className="primary-button" to={lastPath ? `/paths/${lastPath.slug}` : "/paths"}>
          {lastPath ? "Resume trail" : "Browse paths"}
        </Link>
        <Link className="ghost-button" to="/explore">
          Explore terms
        </Link>
      </div>
    </article>
  );
}
