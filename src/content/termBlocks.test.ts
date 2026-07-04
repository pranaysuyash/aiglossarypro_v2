import { describe, expect, it } from "vitest";
import { getTermBlocks } from "./termBlocks";

describe("getTermBlocks", () => {
  it("returns an empty array when blocks are missing or malformed", () => {
    expect(getTermBlocks(null)).toEqual([]);
    expect(getTermBlocks(undefined)).toEqual([]);
    expect(getTermBlocks({})).toEqual([]);
    expect(getTermBlocks({ blocks: null })).toEqual([]);
    expect(getTermBlocks({ blocks: "nope" })).toEqual([]);
  });

  it("returns iterable blocks when present", () => {
    const blocks = [
      { id: "a", type: "markdown", title: "One", body: "Body" },
      { id: "b", type: "faq", title: "Two", items: [] },
    ];

    expect(getTermBlocks({ blocks })).toEqual(blocks);
  });
});
