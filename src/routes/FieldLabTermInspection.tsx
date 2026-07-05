import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCatalog } from "../content/CatalogContext";
import type { TermSummary } from "../types";

const pageSize = 24;

export function FieldLabTermInspection({
  terms,
  isLoading,
  error,
}: {
  terms: TermSummary[];
  isLoading: boolean;
  error: string | null;
}) {
  const { reloadCatalog } = useCatalog();
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "featured" | "standard" | "sparse">("all");
  const [pageIndex, setPageIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

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

  return (
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
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPageIndex(0);
            }}
            name="fieldLabSearch"
            spellCheck={false}
            placeholder="Try: transformer, rag, evaluation, active learning, alignment..."
          />
        </label>
        <label className="field-lab-select">
          <span>Tier filter</span>
          <select
            name="tierFilter"
            value={tierFilter}
            onChange={(event) => {
              setTierFilter(event.target.value as typeof tierFilter);
              setPageIndex(0);
            }}
          >
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
        {error ? (
          <Button variant="raised" size="md" onClick={reloadCatalog}>
            Retry catalog
          </Button>
        ) : null}
        <div className="field-lab-pagination">
          <Button
            variant="raised"
            size="md"
            onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="raised"
            size="md"
            onClick={() => setPageIndex((value) => Math.min(totalPages - 1, value + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </article>
      <div className="field-lab-term-grid">
        {visibleTerms.map((term) => (
          <article key={term.slug} className="field-lab-term-card" style={{ contentVisibility: "auto", containIntrinsicSize: "0 200px" }}>
            <div className="field-lab-term-head">
              <Badge variant="tier">{term.metadata.editorialTier ?? "standard"}</Badge>
              <p className="term-taxonomy">
                {term.taxonomy.category} / {term.taxonomy.subCategory}
              </p>
            </div>
            <h3>{term.title}</h3>
            <p>{term.summary}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="chip">{term.aliases.length} aliases</Badge>
              <Badge variant="chip">{term.metadata.studyFamily || "No family"}</Badge>
              <Badge variant="chip">Shard {term.artifact.shardId}</Badge>
            </div>
            <Button variant="link" asChild><Link to={`/term/${term.slug}`}>
              Open {term.title}
            </Link></Button>
          </article>
        ))}
      </div>
    </section>
  );
}
