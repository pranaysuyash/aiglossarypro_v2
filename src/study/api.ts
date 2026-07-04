import type { NoteRecord, StudySnapshot } from "../types";
import { requestJsonWithToken, type WorkerRequest } from "../platform/workerApi";
const requestJson: WorkerRequest = requestJsonWithToken;

export async function fetchStudySnapshot(apiRequest: WorkerRequest = requestJson): Promise<StudySnapshot> {
  const [bookmarkPayload, notePayload] = await Promise.all([
    apiRequest<{ bookmarks: Array<{ termSlug: string }> }>("/api/bookmarks"),
    apiRequest<{ notes: NoteRecord[] }>("/api/notes"),
  ]);

  return {
    bookmarks: bookmarkPayload.bookmarks.map((bookmark) => bookmark.termSlug).sort(),
    notes: Object.fromEntries(
      notePayload.notes.map((note) => [
        note.termSlug,
        {
          id: note.id,
          title: note.title,
          bodyMarkdown: note.bodyMarkdown,
          visibility: note.visibility,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      ]),
    ),
  };
}

export async function createBookmark(termSlug: string, apiRequest: WorkerRequest = requestJson): Promise<void> {
  await apiRequest("/api/bookmarks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ termSlug }),
  });
}

export async function destroyBookmark(
  termSlug: string,
  apiRequest: WorkerRequest = requestJson,
): Promise<void> {
  await apiRequest("/api/bookmarks", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ termSlug }),
  });
}

export async function saveRemoteNote(
  termSlug: string,
  bodyMarkdown: string,
  apiRequest: WorkerRequest = requestJson,
): Promise<void> {
  await apiRequest("/api/notes", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      termSlug,
      bodyMarkdown,
      visibility: "private",
    }),
  });
}
