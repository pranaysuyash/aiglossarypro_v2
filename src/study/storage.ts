import type { StudySnapshot } from "../types";

const BOOKMARKS_KEY = "aiglossary:bookmarks";
const NOTES_KEY = "aiglossary:notes";
const LAST_OPENED_TERM_KEY = "aiglossary:last-opened-term";
const LAST_OPENED_PATH_KEY = "aiglossary:last-opened-path";

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadBookmarks(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  return parseJson<string[]>(window.localStorage.getItem(BOOKMARKS_KEY), []);
}

export function saveBookmarks(bookmarks: string[]): void {
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function loadNotes(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  return parseJson<Record<string, string>>(window.localStorage.getItem(NOTES_KEY), {});
}

export function saveNotes(notes: Record<string, string>): void {
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadLastOpenedTermSlug(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(LAST_OPENED_TERM_KEY);
}

export function saveLastOpenedTermSlug(slug: string): void {
  window.localStorage.setItem(LAST_OPENED_TERM_KEY, slug);
}

export function loadLastOpenedPathSlug(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(LAST_OPENED_PATH_KEY);
}

export function saveLastOpenedPathSlug(slug: string): void {
  window.localStorage.setItem(LAST_OPENED_PATH_KEY, slug);
}

export function buildLocalSnapshot(): StudySnapshot {
  const bookmarks = loadBookmarks();
  const notes = loadNotes();

  return {
    bookmarks,
    notes: Object.fromEntries(
      Object.entries(notes).map(([slug, bodyMarkdown]) => [
        slug,
        {
          id: null,
          title: null,
          bodyMarkdown,
          visibility: "private",
          createdAt: null,
          updatedAt: null,
        },
      ]),
    ),
  };
}

export function loadStudySnapshot(): StudySnapshot {
  return buildLocalSnapshot();
}

export function saveStudySnapshot(snapshot: StudySnapshot): void {
  saveBookmarks(snapshot.bookmarks);
  saveNotes(
    Object.fromEntries(
      Object.entries(snapshot.notes).map(([slug, note]) => [slug, note.bodyMarkdown]),
    ),
  );
}
