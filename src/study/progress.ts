const OPENED_TERMS_KEY = "aiglossary:opened-terms";
const ACTIVITY_DATES_KEY = "aiglossary:activity-dates";
const QUIZ_ATTEMPTS_KEY = "aiglossary:quiz-attempts";
const REVIEW_SCHEDULE_KEY = "aiglossary:review-schedule";

const MAX_ACTIVITY_DATES = 120;
const MAX_QUIZ_ATTEMPTS = 500;

/** Leitner-style spaced repetition: box index -> days until next review. */
const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;

export type QuizAttempt = {
  termSlug: string;
  blockId: string;
  correct: boolean;
  at: string;
};

export type ReviewEntry = {
  termSlug: string;
  box: number;
  dueAt: string;
};

export function buildOpenedTermHistory(current: string[], termSlug: string): string[] {
  return [...current.filter((slug) => slug !== termSlug), termSlug];
}

export function computeNextReviewEntry(
  termSlug: string,
  current: ReviewEntry | undefined,
  correct: boolean,
  now: Date = new Date(),
): ReviewEntry {
  const nextBox = correct ? Math.min(MAX_BOX, (current?.box ?? 0) + 1) : 1;
  const due = new Date(now);
  due.setDate(due.getDate() + BOX_INTERVAL_DAYS[nextBox]);
  return {
    termSlug,
    box: nextBox,
    dueAt: due.toISOString(),
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  return parseJson(window.localStorage.getItem(key), fallback);
}

function writeLocalStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadOpenedTermSlugs(): string[] {
  return readLocalStorage<string[]>(OPENED_TERMS_KEY, []);
}

export function loadActivityDates(): string[] {
  return readLocalStorage<string[]>(ACTIVITY_DATES_KEY, []);
}

export function loadQuizAttempts(): QuizAttempt[] {
  return readLocalStorage<QuizAttempt[]>(QUIZ_ATTEMPTS_KEY, []);
}

export function loadReviewSchedule(): Record<string, ReviewEntry> {
  return readLocalStorage<Record<string, ReviewEntry>>(REVIEW_SCHEDULE_KEY, {});
}

function recordActivityToday(): void {
  const dates = loadActivityDates();
  const today = todayIso();
  if (dates[dates.length - 1] === today) {
    return;
  }
  const next = [...dates, today].slice(-MAX_ACTIVITY_DATES);
  writeLocalStorage(ACTIVITY_DATES_KEY, next);
}

/** Called once per term view. Cheap to call on every render of a term page. */
export function recordTermOpened(termSlug: string): void {
  const opened = loadOpenedTermSlugs();
  writeLocalStorage(OPENED_TERMS_KEY, buildOpenedTermHistory(opened, termSlug));
  recordActivityToday();
}

/** Records a quiz answer and advances/resets that term's spot in the review queue. */
export function recordQuizAttempt(termSlug: string, blockId: string, correct: boolean): void {
  const attempts = loadQuizAttempts();
  const nextAttempts = [...attempts, { termSlug, blockId, correct, at: new Date().toISOString() }].slice(
    -MAX_QUIZ_ATTEMPTS,
  );
  writeLocalStorage(QUIZ_ATTEMPTS_KEY, nextAttempts);

  const schedule = loadReviewSchedule();
  schedule[termSlug] = computeNextReviewEntry(termSlug, schedule[termSlug], correct);
  writeLocalStorage(REVIEW_SCHEDULE_KEY, schedule);
  recordActivityToday();
}

export function getDueReviews(now: Date = new Date()): ReviewEntry[] {
  const schedule = loadReviewSchedule();
  return Object.values(schedule)
    .filter((entry) => new Date(entry.dueAt).getTime() <= now.getTime())
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

/** Consecutive-day streak, counting today or yesterday as the anchor so a
 * streak isn't reset to zero just because today hasn't happened yet. */
export function computeStreakDays(activityDates: string[], now: Date = new Date()): number {
  if (!activityDates.length) {
    return 0;
  }
  const dateSet = new Set(activityDates);
  const cursor = new Date(now);
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!dateSet.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dateSet.has(key)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeQuizAccuracy(attempts: QuizAttempt[]): number | null {
  if (!attempts.length) {
    return null;
  }
  const correct = attempts.filter((attempt) => attempt.correct).length;
  return Math.round((correct / attempts.length) * 100);
}

/** Last 7 calendar days (oldest first) with whether each had recorded activity. */
export function computeWeekActivity(activityDates: string[], now: Date = new Date()): Array<{ date: string; active: boolean }> {
  const dateSet = new Set(activityDates);
  const days: Array<{ date: string; active: boolean }> = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const cursor = new Date(now);
    cursor.setDate(cursor.getDate() - offset);
    const key = cursor.toISOString().slice(0, 10);
    days.push({ date: key, active: dateSet.has(key) });
  }
  return days;
}
