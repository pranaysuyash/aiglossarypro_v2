import { describe, expect, it } from "vitest";
import type { TermSummary } from "../types";
import {
  buildEditorialTierBreakdown,
  buildInteractiveContentMix,
  buildNotebookSummary,
  buildSavedShelfSummaries,
  getLatestExportJob,
} from "./workspaceInsights";

const terms: TermSummary[] = [
  {
    id: "attention-mechanism",
    slug: "attention-mechanism",
    title: "Attention Mechanism",
    aliases: [],
    summary: "Attention Mechanism summary",
    taxonomy: { topic: "Attention Mechanism", category: "Neural Networks", subCategory: "Attention", tags: [] },
    links: { prerequisites: [], related: [], alternatives: [], next: [] },
    blocks: [],
    metadata: { difficulty: "", maturity: "source-imported", editorialTier: "featured" },
    artifact: { shardId: "at" },
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
    metadata: { difficulty: "", maturity: "source-imported", editorialTier: "sparse" },
    artifact: { shardId: "ev" },
  },
];

describe("workspaceInsights", () => {
  it("groups saved terms into shelf summaries", () => {
    const shelves = buildSavedShelfSummaries(terms, ["attention-mechanism", "evaluation-metrics"]);

    expect(shelves).toHaveLength(2);
    expect(shelves[0].category).toBe("Evaluation");
    expect(shelves[0].count).toBe(1);
    expect(shelves[1].representativeTerms[0].title).toBe("Attention Mechanism");
  });

  it("summarizes notebook depth", () => {
    const summary = buildNotebookSummary(terms, {
      "attention-mechanism": "one two three four five",
      "evaluation-metrics": "one two three four five six seven eight nine ten",
    });

    expect(summary.noteCount).toBe(2);
    expect(summary.totalWords).toBe(15);
    expect(summary.averageWords).toBe(8);
    expect(summary.longestNote?.slug).toBe("evaluation-metrics");
    expect(summary.denseNotes[0].wordCount).toBe(10);
  });

  it("summarizes editorial depth tiers", () => {
    const breakdown = buildEditorialTierBreakdown(terms, ["attention-mechanism", "evaluation-metrics"]);

    expect(breakdown.featured).toBe(1);
    expect(breakdown.standard).toBe(0);
    expect(breakdown.sparse).toBe(1);
    expect(breakdown.total).toBe(2);
  });

  it("summarizes interactive content mix", () => {
    const mixedTerms = terms.map((term, index) => ({
      ...term,
      blocks: [
        { id: `${term.slug}-quiz`, type: "quiz" as const, title: "Quiz", question: "", options: [], answerIndex: 0, explanation: "" },
        { id: `${term.slug}-diagram`, type: "diagram" as const, title: "Diagram", center: { label: "", caption: "" }, lanes: [], takeaway: "" },
        ...(index === 0
          ? [{ id: `${term.slug}-faq`, type: "faq" as const, title: "FAQ", items: [] }]
          : []),
        ...(index === 1
          ? [{ id: `${term.slug}-comparison`, type: "comparison" as const, title: "Comparison", panels: [], takeaway: "" }]
          : []),
      ],
    }));

    const mix = buildInteractiveContentMix(mixedTerms, ["attention-mechanism", "evaluation-metrics"]);

    expect(mix.quizzes).toBe(2);
    expect(mix.diagrams).toBe(2);
    expect(mix.faqs).toBe(1);
    expect(mix.comparisons).toBe(1);
    expect(mix.deepDives).toBe(0);
  });

  it("selects the latest export job", () => {
    const job = getLatestExportJob([
      { id: "1", exportType: "study-json", status: "done", objectKey: null, requestedAt: "2026-06-29T01:00:00Z", completedAt: null },
      { id: "2", exportType: "study-json", status: "done", objectKey: null, requestedAt: "2026-06-30T01:00:00Z", completedAt: null },
    ]);

    expect(job?.id).toBe("2");
  });
});
