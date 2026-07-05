import type { ExportJobRecord, NoteRecord, TermSummary } from "../types";
import { getTermBlocks } from "../content/termBlocks";

export type SavedShelfSummary = {
  category: string;
  count: number;
  representativeTerms: Array<Pick<TermSummary, "slug" | "title" | "taxonomy">>;
};

export type NotebookSummary = {
  noteCount: number;
  totalWords: number;
  averageWords: number;
  longestNote: {
    slug: string;
    title: string;
    wordCount: number;
  } | null;
  denseNotes: Array<{
    slug: string;
    title: string;
    excerpt: string;
    wordCount: number;
  }>;
};

export type EditorialTierBreakdown = {
  featured: number;
  standard: number;
  sparse: number;
  total: number;
};

export type InteractiveContentMix = {
  quizzes: number;
  diagrams: number;
  faqs: number;
  comparisons: number;
  deepDives: number;
};

export function buildSavedShelfSummaries(terms: TermSummary[], bookmarkSlugs: string[]): SavedShelfSummary[] {
  const bookmarkSet = new Set(bookmarkSlugs);
  const bookmarkedTerms = terms.filter((term) => bookmarkSet.has(term.slug));
  const groups = bookmarkedTerms.reduce<Record<string, typeof bookmarkedTerms>>((accumulator, term) => {
    const key = term.taxonomy.category || "General";
    accumulator[key] ??= [];
    accumulator[key].push(term);
    return accumulator;
  }, {});

  return Object.entries(groups)
    .map(([category, categoryTerms]) => ({
      category,
      count: categoryTerms.length,
      representativeTerms: categoryTerms.slice(0, 3).map((term) => ({
        slug: term.slug,
        title: term.title,
        taxonomy: term.taxonomy,
      })),
    }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));
}

export function buildNotebookSummary(terms: TermSummary[], notes: Record<string, string>): NotebookSummary {
  const populatedNotes = terms
    .filter((term) => (notes[term.slug] ?? "").trim())
    .map((term) => {
      const body = notes[term.slug].trim();
      const wordCount = body.split(/\s+/).filter(Boolean).length;
      return {
        slug: term.slug,
        title: term.title,
        body,
        wordCount,
      };
    });

  const totalWords = populatedNotes.reduce((sum, note) => sum + note.wordCount, 0);
  const longestNote = populatedNotes.length
    ? populatedNotes.reduce((current, note) => (note.wordCount > current.wordCount ? note : current))
    : null;

  return {
    noteCount: populatedNotes.length,
    totalWords,
    averageWords: populatedNotes.length ? Math.round(totalWords / populatedNotes.length) : 0,
    longestNote: longestNote
      ? {
          slug: longestNote.slug,
          title: longestNote.title,
          wordCount: longestNote.wordCount,
        }
      : null,
    denseNotes: populatedNotes
      .slice()
      .sort((left, right) => right.wordCount - left.wordCount || left.title.localeCompare(right.title))
      .slice(0, 4)
      .map((note) => ({
        slug: note.slug,
        title: note.title,
        excerpt: buildExcerpt(note.body),
        wordCount: note.wordCount,
      })),
  };
}

export function buildEditorialTierBreakdown(terms: TermSummary[], slugs: string[]): EditorialTierBreakdown {
  const slugSet = new Set(slugs);
  const breakdown: EditorialTierBreakdown = {
    featured: 0,
    standard: 0,
    sparse: 0,
    total: 0,
  };

  for (const term of terms) {
    if (!slugSet.has(term.slug)) continue;
    const tier = term.metadata.editorialTier ?? "standard";
    breakdown[tier] += 1;
    breakdown.total += 1;
  }

  return breakdown;
}

export function buildInteractiveContentMix(terms: TermSummary[], slugs: string[]): InteractiveContentMix {
  const slugSet = new Set(slugs);
  const mix: InteractiveContentMix = {
    quizzes: 0,
    diagrams: 0,
    faqs: 0,
    comparisons: 0,
    deepDives: 0,
  };

  for (const term of terms) {
    if (!slugSet.has(term.slug)) continue;
    for (const block of getTermBlocks(term)) {
      if (block.type === "quiz") {
        mix.quizzes += 1;
      } else if (block.type === "diagram") {
        mix.diagrams += 1;
      } else if (block.type === "faq") {
        mix.faqs += 1;
      } else if (block.type === "comparison") {
        mix.comparisons += 1;
      } else if (block.type === "deep-dive") {
        mix.deepDives += 1;
      }
    }
  }

  return mix;
}

export function getLatestExportJob(exportJobs: ExportJobRecord[]): ExportJobRecord | null {
  if (!exportJobs.length) {
    return null;
  }

  return [...exportJobs].sort((left, right) => {
    const rightRequested = Date.parse(right.requestedAt || "");
    const leftRequested = Date.parse(left.requestedAt || "");
    if (!Number.isNaN(rightRequested) && !Number.isNaN(leftRequested)) {
      return rightRequested - leftRequested;
    }
    return (right.requestedAt || "").localeCompare(left.requestedAt || "");
  })[0];
}

function buildExcerpt(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= 160) {
    return normalized;
  }

  return `${normalized.slice(0, 157).trimEnd()}...`;
}
