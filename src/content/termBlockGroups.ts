import type { TermBlock } from "../types";

export type TermExtraTabKey = "compare" | "quiz" | "diagram" | "faq" | "deep-dive" | "curriculum" | "reference";

export type TermExtraTab = {
  key: TermExtraTabKey;
  label: string;
  blocks: TermBlock[];
};

const EXTRA_TAB_ORDER: Array<{ key: TermExtraTabKey; label: string }> = [
  { key: "compare", label: "Compare" },
  { key: "quiz", label: "Quiz" },
  { key: "diagram", label: "Diagram" },
  { key: "faq", label: "FAQ" },
  { key: "deep-dive", label: "Deep dive" },
  { key: "curriculum", label: "Curriculum" },
  { key: "reference", label: "Reference" },
];

const BLOCK_ID_TO_TAB: Record<string, TermExtraTabKey> = {
  "comparison-notes": "compare",
  comparison: "compare",
  "quick-quiz": "quiz",
  "concept-map": "diagram",
  "quick-faq": "faq",
  "deep-dive": "deep-dive",
  "curriculum-map": "curriculum",
  "structure-expansion": "curriculum",
  taxonomy: "reference",
  connections: "reference",
  "at-a-glance": "reference",
  "study-prompts": "reference",
  "recall-drill": "reference",
  "source-definition": "reference",
};

const CORE_BLOCK_IDS = new Set(["overview", "why-it-matters", "visual-summary"]);

/** Which tab a block's id opens, or null when the block stays in the core column. */
export function getBlockTabKey(blockId: string): TermExtraTabKey | null {
  if (CORE_BLOCK_IDS.has(blockId)) {
    return null;
  }
  return BLOCK_ID_TO_TAB[blockId] ?? "reference";
}

/**
 * A published term can carry up to 17 block types. Rendering all of them
 * sequentially turns every term page into a ~10,000px scroll. Split into a
 * short always-visible "core" reading path and a tab strip for the rest,
 * so the default view stays short and the depth stays one click away.
 */
export function splitTermBlocks(blocks: TermBlock[]): {
  core: TermBlock[];
  extras: TermExtraTab[];
} {
  const core: TermBlock[] = [];
  const byTab = new Map<TermExtraTabKey, TermBlock[]>();

  for (const block of blocks) {
    if (CORE_BLOCK_IDS.has(block.id)) {
      core.push(block);
      continue;
    }

    const tabKey = BLOCK_ID_TO_TAB[block.id] ?? "reference";
    const bucket = byTab.get(tabKey) ?? [];
    bucket.push(block);
    byTab.set(tabKey, bucket);
  }

  const extras = EXTRA_TAB_ORDER.filter((tab) => byTab.has(tab.key)).map((tab) => ({
    ...tab,
    blocks: byTab.get(tab.key) ?? [],
  }));

  return { core, extras };
}
