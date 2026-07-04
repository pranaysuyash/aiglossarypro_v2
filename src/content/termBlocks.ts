import type { TermBlock } from "../types";

type TermBlockSource = {
  blocks?: unknown;
};

export function getTermBlocks(term: TermBlockSource | null | undefined): TermBlock[] {
  if (!term || !Array.isArray(term.blocks)) {
    return [];
  }

  return term.blocks.filter((block): block is TermBlock => Boolean(block) && typeof block === "object");
}
