import { describe, expect, it } from "vitest";
import type { TermRecord } from "../types";
import { buildFamilyHighlights, familySlug, isFamilyMatch } from "./familyHighlights";

const terms: TermRecord[] = [
  {
    id: "activation-function",
    slug: "activation-function",
    title: "Activation Function",
    aliases: [],
    summary: "Activation Function summary",
    taxonomy: { topic: "Activation Function", category: "Neural Networks", subCategory: "Components", tags: [] },
    links: { prerequisites: [], related: [], alternatives: [], next: [] },
    blocks: [],
    metadata: { difficulty: "", maturity: "source-imported", editorialTier: "featured", studyFamily: "Neural Networks" },
    artifact: { shardId: "ac" },
    source: {
      glossaryWorkbook: {
        file: "data_glossary.xlsx",
        sheetName: "main",
        inventoryRows: [2],
        inventoryCells: ["A2"],
        inventoryColumns: ["A"],
        sourceCells: [],
        taxonomyRow: 3,
        definitionRow: 3,
        definitionBody: "Activation Function summary",
      },
    },
  },
  {
    id: "relu",
    slug: "relu",
    title: "ReLU",
    aliases: [],
    summary: "ReLU summary",
    taxonomy: { topic: "ReLU", category: "Neural Networks", subCategory: "Components", tags: [] },
    links: { prerequisites: [], related: [], alternatives: [], next: [] },
    blocks: [],
    metadata: { difficulty: "", maturity: "source-imported", editorialTier: "standard", studyFamily: "Neural Networks" },
    artifact: { shardId: "re" },
    source: {
      glossaryWorkbook: {
        file: "data_glossary.xlsx",
        sheetName: "main",
        inventoryRows: [3],
        inventoryCells: ["A3"],
        inventoryColumns: ["A"],
        sourceCells: [],
        taxonomyRow: 4,
        definitionRow: null,
        definitionBody: null,
      },
    },
  },
  {
    id: "evaluation-metrics",
    slug: "evaluation-metrics",
    title: "Evaluation Metrics",
    aliases: [],
    summary: "Evaluation Metrics summary",
    taxonomy: { topic: "Evaluation Metrics", category: "Evaluation", subCategory: "Metrics", tags: [] },
    links: { prerequisites: [], related: [], alternatives: [], next: [] },
    blocks: [],
    metadata: { difficulty: "", maturity: "source-imported", editorialTier: "sparse", studyFamily: "Evaluation" },
    artifact: { shardId: "ev" },
    source: {
      glossaryWorkbook: {
        file: "data_glossary.xlsx",
        sheetName: "main",
        inventoryRows: [4],
        inventoryCells: ["A4"],
        inventoryColumns: ["A"],
        sourceCells: [],
        taxonomyRow: 5,
        definitionRow: null,
        definitionBody: null,
      },
    },
  },
];

describe("buildFamilyHighlights", () => {
  it("groups terms into flagship families and prefers featured terms first", () => {
    const families = buildFamilyHighlights(terms);
    const neuralNetworks = families.find((family) => family.title === "Neural Networks");

    expect(families).toHaveLength(2);
    expect(neuralNetworks?.count).toBe(2);
    expect(neuralNetworks?.featuredCount).toBe(1);
    expect(neuralNetworks?.strongestTerm?.slug).toBe("activation-function");
    expect(neuralNetworks?.terms[0].slug).toBe("activation-function");
  });

  it("creates stable family slugs", () => {
    expect(familySlug("Ethics & Governance")).toBe("ethics-governance");
    expect(familySlug("Similarity & Deduplication")).toBe("similarity-deduplication");
  });

  it("matches family by study family, category, or topic", () => {
    const term = terms[1];
    expect(isFamilyMatch(term, "Neural Networks")).toBe(true);
    expect(isFamilyMatch(term, "Evaluation")).toBe(false);
    expect(isFamilyMatch(terms[0], "Activation Function")).toBe(true);
  });
});
