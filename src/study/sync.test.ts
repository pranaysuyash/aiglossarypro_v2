import { afterEach, describe, expect, it, vi } from "vitest";
import type { StudySnapshot } from "../types";
import { buildStudySignInPlan, syncLocalStudyToRemote } from "./sync";

describe("study sync plan", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseLocalSnapshot: StudySnapshot = {
    bookmarks: ["attention", "gradient"],
    notes: {
      attention: {
        id: null,
        title: null,
        bodyMarkdown: "Local attention note",
        visibility: "private",
        createdAt: null,
        updatedAt: null,
      },
      bias: {
        id: null,
        title: null,
        bodyMarkdown: "Local bias note",
        visibility: "private",
        createdAt: null,
        updatedAt: null,
      },
    },
  };

  const baseRemoteSnapshot: StudySnapshot = {
    bookmarks: ["attention", "backprop"],
    notes: {
      attention: {
        id: "note-1",
        title: "Attention",
        bodyMarkdown: "Remote attention note",
        visibility: "private",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      embedding: {
        id: "note-2",
        title: "Embedding",
        bodyMarkdown: "Remote embedding note",
        visibility: "private",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    },
  };

  it("builds a sign-in plan with local-only additions", () => {
    const plan = buildStudySignInPlan(baseLocalSnapshot, baseRemoteSnapshot);

    expect(plan.missingBookmarks).toEqual(["gradient"]);
    expect(plan.missingNotes).toEqual([
      {
        slug: "bias",
        note: baseLocalSnapshot.notes.bias,
      },
    ]);
    expect(plan.mergedSnapshot.bookmarks).toEqual(["attention", "backprop", "gradient"]);
    expect(Object.keys(plan.mergedSnapshot.notes).sort()).toEqual(["attention", "bias", "embedding"]);
    expect(plan.mergedSnapshot.notes.bias.bodyMarkdown).toBe("Local bias note");
    expect(plan.mergedSnapshot.notes.embedding.bodyMarkdown).toBe("Remote embedding note");
  });

  it("syncs only local-only study entries to remote", async () => {
    const addBookmark = vi.fn(async () => undefined);
    const saveNote = vi.fn(async () => undefined);

    const result = await syncLocalStudyToRemote(baseLocalSnapshot, baseRemoteSnapshot, {
      addBookmark,
      saveNote,
    });

    expect(addBookmark).toHaveBeenCalledTimes(1);
    expect(addBookmark).toHaveBeenCalledWith("gradient");

    expect(saveNote).toHaveBeenCalledTimes(1);
    expect(saveNote).toHaveBeenCalledWith("bias", "Local bias note");
    expect(result.syncErrors).toEqual([]);

    expect(result.mergedSnapshot.notes.gradient).toBeUndefined();
    expect(result.mergedSnapshot.bookmarks).toEqual(["attention", "backprop", "gradient"]);
    expect(Object.keys(result.mergedSnapshot.notes).sort()).toEqual(["attention", "bias", "embedding"]);
  });

  it("records sync failures without aborting the full merge", async () => {
    const addBookmark = vi.fn(async (slug) => {
      if (slug === "gradient") {
        throw new Error("bookmark save failed");
      }
    });

    const saveNote = vi.fn(async (slug) => {
      if (slug === "bias") {
        throw new Error("note save failed");
      }
    });

    const result = await syncLocalStudyToRemote(baseLocalSnapshot, baseRemoteSnapshot, {
      addBookmark,
      saveNote,
    });

    expect(result.syncErrors).toEqual([
      { kind: "bookmark", slug: "gradient", error: "bookmark save failed" },
      { kind: "note", slug: "bias", error: "note save failed" },
    ]);
    expect(result.mergedSnapshot).toEqual({
      bookmarks: ["attention", "backprop", "gradient"],
      notes: {
        attention: baseRemoteSnapshot.notes.attention,
        embedding: baseRemoteSnapshot.notes.embedding,
        bias: baseLocalSnapshot.notes.bias,
      },
    });
  });

  it("does not sync when local state is already contained in remote", async () => {
    const alreadyRemote: StudySnapshot = {
      bookmarks: ["attention", "gradient"],
      notes: {
        attention: baseRemoteSnapshot.notes.attention,
        embedding: baseRemoteSnapshot.notes.embedding,
        bias: {
          id: "note-3",
          title: "Bias",
          bodyMarkdown: "Remote bias note",
          visibility: "private",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        gradient: {
          id: "note-4",
          title: "Gradient",
          bodyMarkdown: "Remote gradient note",
          visibility: "private",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      },
    };

    const addBookmark = vi.fn(async () => undefined);
    const saveNote = vi.fn(async () => undefined);

    const plan = buildStudySignInPlan(baseLocalSnapshot, alreadyRemote);
    expect(plan.missingBookmarks).toEqual([]);
    expect(plan.missingNotes).toHaveLength(0);

    const result = await syncLocalStudyToRemote(baseLocalSnapshot, alreadyRemote, {
      addBookmark,
      saveNote,
    });

    expect(addBookmark).not.toHaveBeenCalled();
    expect(saveNote).not.toHaveBeenCalled();
    expect(result.mergedSnapshot).toEqual(alreadyRemote);
  });
});
