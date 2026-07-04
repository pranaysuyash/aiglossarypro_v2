import { describe, expect, it } from "vitest";
import { splitTermBlocks } from "./termBlockGroups";
import type { TermBlock } from "../types";

function markdown(id: string): TermBlock {
  return { id, type: "markdown", title: id, body: "body" };
}

function faq(id: string): TermBlock {
  return { id, type: "faq", title: id, items: [] };
}

describe("splitTermBlocks", () => {
  it("keeps overview and why-it-matters as core and empty extras when nothing else exists", () => {
    const { core, extras } = splitTermBlocks([markdown("overview"), markdown("why-it-matters")]);
    expect(core.map((b) => b.id)).toEqual(["overview", "why-it-matters"]);
    expect(extras).toEqual([]);
  });

  it("groups quiz, faq, and unmapped ids under their tabs in a stable order", () => {
    const { core, extras } = splitTermBlocks([
      faq("quick-faq"),
      markdown("overview"),
      { id: "quick-quiz", type: "quiz", title: "q", question: "q", options: [], answerIndex: 0, explanation: "" },
      markdown("source-definition"),
    ]);

    expect(core.map((b) => b.id)).toEqual(["overview"]);
    expect(extras.map((tab) => tab.key)).toEqual(["quiz", "faq", "reference"]);
    expect(extras.find((tab) => tab.key === "reference")?.blocks.map((b) => b.id)).toEqual(["source-definition"]);
  });

  it("only returns tabs that have content", () => {
    const { extras } = splitTermBlocks([markdown("overview")]);
    expect(extras).toEqual([]);
  });
});
