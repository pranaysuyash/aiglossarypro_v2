import { useCallback, createContext, useMemo, useRef, use, type ReactNode } from "react";
import type { LearningPathRecord, LearningPathSummary, TermRecord, TermSummary } from "../types";

type CatalogContextValue = {
  terms: TermSummary[];
  termMap: Map<string, TermSummary>;
  paths: LearningPathSummary[];
  pathMap: Map<string, LearningPathSummary>;
  isLoading: boolean;
  error: string | null;
  loadTerm: (slug: string) => Promise<TermRecord | null>;
  loadPath: (slug: string) => Promise<LearningPathRecord | null>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

type CatalogBootstrap = {
  terms: TermSummary[];
  paths: LearningPathSummary[];
  error: string | null;
};

const catalogBootstrapPromise: Promise<CatalogBootstrap> = (async () => {
  try {
    const [termResponse, pathResponse] = await Promise.all([
      fetch("/content/published/terms/index.json", {
        headers: { accept: "application/json" },
      }),
      fetch("/content/published/paths/index.json", {
        headers: { accept: "application/json" },
      }),
    ]);
    if (!termResponse.ok) {
      throw new Error(`Catalog request failed with status ${termResponse.status}`);
    }
    if (!pathResponse.ok) {
      throw new Error(`Path request failed with status ${pathResponse.status}`);
    }

    const [termPayload, pathPayload] = await Promise.all([
      termResponse.json() as Promise<TermSummary[]>,
      pathResponse.json() as Promise<LearningPathSummary[]>,
    ]);

    return {
      terms: termPayload,
      paths: pathPayload,
      error: null,
    };
  } catch (loadError) {
    return {
      terms: [],
      paths: [],
      error: loadError instanceof Error ? loadError.message : "Catalog load failed",
    };
  }
})();

export function CatalogProvider({ children }: { children: ReactNode }) {
  const bootstrap = use(catalogBootstrapPromise);
  const { terms, paths, error } = bootstrap;
  const isLoading = false;
  const termCacheRef = useRef<Map<string, TermRecord> | null>(null);
  const shardCacheRef = useRef<Map<string, Map<string, TermRecord>> | null>(null);
  const pathCacheRef = useRef<Map<string, LearningPathRecord> | null>(null);

  if (!termCacheRef.current) {
    termCacheRef.current = new Map();
  }
  if (!shardCacheRef.current) {
    shardCacheRef.current = new Map();
  }
  if (!pathCacheRef.current) {
    pathCacheRef.current = new Map();
  }

  const loadTerm = useCallback(async (slug: string): Promise<TermRecord | null> => {
    const cached = termCacheRef.current?.get(slug);
    if (cached) {
      return cached;
    }

    // Try fetching the individual term file first (lazy load)
    const individualResponse = await fetch(`/content/published/terms/by-slug/${slug}.json`, {
      headers: { accept: "application/json" },
    });
    if (individualResponse.ok) {
      const payload = (await individualResponse.json()) as TermRecord;
      termCacheRef.current?.set(payload.slug, payload);
      return payload;
    }

    // Fall back to shard loading if individual file is not available
    const summary = terms.find((term) => term.slug === slug);
    if (!summary) {
      return null;
    }

    const shardId = summary.artifact.shardId;
    const cachedShard = shardCacheRef.current?.get(shardId);
    if (cachedShard) {
      return cachedShard.get(slug) ?? null;
    }

    const shardResponse = await fetch(`/content/published/terms/shards/${shardId}.json`, {
      headers: { accept: "application/json" },
    });
    if (shardResponse.status === 404) {
      return null;
    }
    if (!shardResponse.ok) {
      throw new Error(`Term request failed with status ${shardResponse.status}`);
    }

    const shardPayload = (await shardResponse.json()) as {
      id: string;
      termCount: number;
      terms: TermRecord[];
    };
    const shardMap = new Map(shardPayload.terms.map((term) => [term.slug, term]));
    shardCacheRef.current?.set(shardId, shardMap);

    for (const term of shardPayload.terms) {
      termCacheRef.current?.set(term.slug, term);
    }

    return shardMap.get(slug) ?? null;
  }, [terms]);

  const loadPath = useCallback(async (slug: string): Promise<LearningPathRecord | null> => {
    const cached = pathCacheRef.current?.get(slug);
    if (cached) {
      return cached;
    }

    const response = await fetch(`/content/published/paths/by-slug/${slug}.json`, {
      headers: { accept: "application/json" },
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Path request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as LearningPathRecord;
    pathCacheRef.current?.set(slug, payload);
    return payload;
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      terms,
      termMap: new Map(terms.map((term) => [term.slug, term])),
      paths,
      pathMap: new Map(paths.map((path) => [path.slug, path])),
      isLoading,
      error,
      loadTerm,
      loadPath,
    }),
    [error, isLoading, loadPath, loadTerm, paths, terms],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = use(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
