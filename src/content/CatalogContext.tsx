import { useCallback, createContext, useMemo, useRef, use, useState, type ReactNode } from "react";
import type { LearningPathRecord, LearningPathSummary, TermRecord, TermSummary } from "../types";

type CatalogContextValue = {
  terms: TermSummary[];
  termMap: Map<string, TermSummary>;
  paths: LearningPathSummary[];
  pathMap: Map<string, LearningPathSummary>;
  isLoading: boolean;
  error: string | null;
  reloadCatalog: () => void;
  loadTerm: (slug: string) => Promise<TermRecord | null>;
  loadPath: (slug: string) => Promise<LearningPathRecord | null>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

type CatalogBootstrap = {
  terms: TermSummary[];
  paths: LearningPathSummary[];
  error: string | null;
};

const catalogBootstrapCache = new Map<number, Promise<CatalogBootstrap>>();

function getCatalogBootstrapPromise(version: number): Promise<CatalogBootstrap> {
  const cached = catalogBootstrapCache.get(version);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
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

  catalogBootstrapCache.set(version, promise);
  return promise;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [bootstrapVersion, setBootstrapVersion] = useState(0);
  const bootstrap = use(getCatalogBootstrapPromise(bootstrapVersion));
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
    const individualPayload = await fetch(`/content/published/terms/by-slug/${slug}.json`, {
      headers: { accept: "application/json" },
    })
      .then((r) => (r.ok ? (r.json() as Promise<TermRecord>) : null))
      .catch(() => null);

    if (individualPayload) {
      termCacheRef.current?.set(individualPayload.slug, individualPayload);
      return individualPayload;
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

    const shardPayload = await fetch(`/content/published/terms/shards/${shardId}.json`, {
      headers: { accept: "application/json" },
    })
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`Term request failed with status ${r.status}`);
        return r.json() as Promise<{
          id: string;
          termCount: number;
          terms: TermRecord[];
        }>;
      })
      .catch(() => null);

    if (!shardPayload) {
      return null;
    }

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

  const reloadCatalog = useCallback(() => {
    setBootstrapVersion((value) => {
      catalogBootstrapCache.delete(value);
      return value + 1;
    });
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      terms,
      termMap: new Map(terms.map((term) => [term.slug, term])),
      paths,
      pathMap: new Map(paths.map((path) => [path.slug, path])),
      isLoading,
      error,
      reloadCatalog,
      loadTerm,
      loadPath,
    }),
    [error, isLoading, loadPath, loadTerm, paths, reloadCatalog, terms],
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
