import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAppState } from "../platform/AppContext";
import type { StudySnapshot } from "../types";
import { useWorkerRequest } from "../platform/workerApi";
import { createBookmark, destroyBookmark, fetchStudySnapshot, saveRemoteNote } from "./api";
import {
  loadLastOpenedTermSlug,
  loadStudySnapshot,
  saveBookmarks,
  saveLastOpenedTermSlug,
  saveNotes,
  saveStudySnapshot,
} from "./storage";
import { buildStudySignInPlan, syncLocalStudyToRemote } from "./sync";

type StudyContextValue = {
  bookmarks: string[];
  notes: Record<string, string>;
  lastOpenedTermSlug: string | null;
  isRemoteBacked: boolean;
  toggleBookmark: (slug: string) => Promise<void>;
  setNote: (slug: string, value: string) => Promise<void>;
  markTermOpened: (slug: string) => void;
  exportStudyData: () => void;
};

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { session, hasActiveMembership } = useAppState();
  const apiRequest = useWorkerRequest();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [lastOpenedTermSlug, setLastOpenedTermSlug] = useState<string | null>(null);
  const isRemoteBacked = Boolean(session?.authenticated && session.user && hasActiveMembership);

  useEffect(() => {
    let isCancelled = false;

    async function loadStudyState() {
      const fallbackSnapshot = loadStudySnapshot();
      let remoteSnapshot: StudySnapshot | null = null;
      let syncPlan: ReturnType<typeof buildStudySignInPlan> | null = null;

      if (!isRemoteBacked) {
        if (!isCancelled) {
          applySnapshot(fallbackSnapshot, setBookmarks, setNotes);
          setLastOpenedTermSlug(loadLastOpenedTermSlug());
        }
        return;
      }

      try {
        remoteSnapshot = await fetchStudySnapshot(apiRequest);
        syncPlan = buildStudySignInPlan(fallbackSnapshot, remoteSnapshot);
        let mergedSnapshot = remoteSnapshot;
        if (syncPlan.missingBookmarks.length > 0 || syncPlan.missingNotes.length > 0) {
          const syncResult = await syncLocalStudyToRemote(fallbackSnapshot, remoteSnapshot, {
            addBookmark: (slug) => createBookmark(slug, apiRequest),
            saveNote: (slug, bodyMarkdown) => saveRemoteNote(slug, bodyMarkdown, apiRequest),
          });
          if (syncResult.syncErrors.length) {
            console.warn("Sync completed with partial failures", syncResult.syncErrors);
          }
          mergedSnapshot = syncResult.mergedSnapshot;
        }

        if (!isCancelled) {
          saveStudySnapshot(mergedSnapshot);
          applySnapshot(mergedSnapshot, setBookmarks, setNotes);
          setLastOpenedTermSlug(loadLastOpenedTermSlug());
        }
      } catch (error) {
        console.error("Failed to sync remote study state; using fallback snapshot.", error);
        if (!isCancelled) {
          const fallbackMerge = syncPlan?.mergedSnapshot ?? remoteSnapshot;
          applySnapshot(fallbackMerge ?? fallbackSnapshot, setBookmarks, setNotes);
          setLastOpenedTermSlug(loadLastOpenedTermSlug());
        }
      }
    }

    void loadStudyState();

    return () => {
      isCancelled = true;
    };
  }, [apiRequest, isRemoteBacked]);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const value = useMemo<StudyContextValue>(
    () => ({
      bookmarks,
      notes,
      lastOpenedTermSlug,
      isRemoteBacked,
      async toggleBookmark(slug) {
        const nextBookmarks = bookmarks.includes(slug)
          ? bookmarks.filter((item) => item !== slug)
          : [...bookmarks, slug].sort();

        startTransition(() => {
          setBookmarks(nextBookmarks);
        });

        if (isRemoteBacked) {
          if (bookmarks.includes(slug)) {
            await destroyBookmark(slug, apiRequest);
          } else {
            await createBookmark(slug, apiRequest);
          }
        }
      },
      async setNote(slug, value) {
        startTransition(() => {
          setNotes((current) => ({
            ...current,
            [slug]: value,
          }));
        });

        if (isRemoteBacked) {
          await saveRemoteNote(slug, value, apiRequest);
        }
      },
      markTermOpened(slug) {
        startTransition(() => {
          setLastOpenedTermSlug(slug);
        });
        saveLastOpenedTermSlug(slug);
      },
      exportStudyData() {
        const payload = {
          exportedAt: new Date().toISOString(),
          bookmarks,
          notes,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "aiglossary-study-export.json";
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
    }),
    [apiRequest, bookmarks, isRemoteBacked, lastOpenedTermSlug, notes],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within StudyProvider");
  }
  return context;
}

function applySnapshot(
  snapshot: StudySnapshot,
  setBookmarks: (bookmarks: string[]) => void,
  setNotes: (notes: Record<string, string>) => void,
) {
  setBookmarks(snapshot.bookmarks);
  setNotes(
    Object.fromEntries(
      Object.entries(snapshot.notes).map(([slug, note]) => [slug, note.bodyMarkdown]),
    ),
  );
}
