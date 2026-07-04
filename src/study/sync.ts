import type { StudySnapshot } from "../types";

export type NotePayload = {
  id: string | null;
  title: string | null;
  bodyMarkdown: string;
  visibility: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type StudySyncPlan = {
  missingBookmarks: string[];
  missingNotes: Array<{ slug: string; note: NotePayload }>;
  syncErrors: Array<{ kind: "bookmark" | "note"; slug: string; error: string }>;
  mergedSnapshot: StudySnapshot;
};

type StudySyncPorts = {
  addBookmark: (slug: string) => Promise<void>;
  saveNote: (slug: string, bodyMarkdown: string) => Promise<void>;
};

function dedupeSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

export function buildStudySignInPlan(local: StudySnapshot, remote: StudySnapshot): StudySyncPlan {
  const remoteBookmarkSet = new Set(remote.bookmarks);
  const remoteNotes = remote.notes;

  const missingBookmarks = local.bookmarks.filter((slug) => !remoteBookmarkSet.has(slug));
  const missingNotes = Object.entries(local.notes)
    .filter(([slug]) => !remoteNotes[slug])
    .map(([slug, note]) => ({ slug, note }));

  return {
    missingBookmarks,
    missingNotes,
    syncErrors: [],
    mergedSnapshot: {
      bookmarks: dedupeSorted([...remote.bookmarks, ...missingBookmarks]),
      notes: {
        ...remote.notes,
        ...Object.fromEntries(missingNotes.map(({ slug, note }) => [slug, note])),
      },
    },
  };
}

export async function syncLocalStudyToRemote(
  localSnapshot: StudySnapshot,
  remoteSnapshot: StudySnapshot,
  ports: StudySyncPorts,
): Promise<StudySyncPlan> {
  const plan = buildStudySignInPlan(localSnapshot, remoteSnapshot);
  const syncErrors: StudySyncPlan["syncErrors"] = [];

  await Promise.allSettled([
    ...plan.missingBookmarks.map((bookmark) =>
      ports.addBookmark(bookmark).catch((error) => {
        syncErrors.push({
          kind: "bookmark",
          slug: bookmark,
          error: error instanceof Error ? error.message : "failed",
        });
      }),
    ),
    ...plan.missingNotes.map(({ slug, note }) =>
      ports.saveNote(slug, note.bodyMarkdown).catch((error) => {
        syncErrors.push({
          kind: "note",
          slug,
          error: error instanceof Error ? error.message : "failed",
        });
      }),
    ),
  ]);

  return {
    ...plan,
    syncErrors,
    mergedSnapshot: plan.mergedSnapshot,
  };
}
