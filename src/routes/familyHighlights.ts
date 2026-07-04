import type { TermSummary } from "../types";
import { flagshipFamilies, type FlagshipFamily } from "../content/flagshipFamilies";

export type FamilyHighlight = FlagshipFamily & {
  count: number;
  featuredCount: number;
  terms: TermSummary[];
  strongestTerm: TermSummary | null;
};

export function isFamilyMatch(term: TermSummary, familyTitle: string): boolean {
  return (
    term.metadata.studyFamily === familyTitle || term.taxonomy.category === familyTitle || term.taxonomy.topic === familyTitle
  );
}

export function familySlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildFamilyHighlights(terms: TermSummary[]): FamilyHighlight[] {
  return flagshipFamilies
    .map((family) => {
      const familyTerms = terms.filter((term) => isFamilyMatch(term, family.title));
      const sortedTerms = [...familyTerms].sort((left, right) => {
        const tierRank = tierScore(right.metadata.editorialTier) - tierScore(left.metadata.editorialTier);
        if (tierRank !== 0) {
          return tierRank;
        }
        return left.title.localeCompare(right.title);
      });

      return {
        ...family,
        count: familyTerms.length,
        featuredCount: familyTerms.filter((term) => term.metadata.editorialTier === "featured").length,
        terms: sortedTerms.slice(0, 4),
        strongestTerm: sortedTerms[0] ?? null,
      };
    })
    .filter((family) => family.count > 0);
}

function tierScore(tier: TermSummary["metadata"]["editorialTier"]): number {
  if (tier === "featured") {
    return 3;
  }
  if (tier === "standard") {
    return 2;
  }
  return 1;
}
