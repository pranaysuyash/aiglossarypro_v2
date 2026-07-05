import { describe, expect, it } from "vitest";
import {
  buildOpenedTermHistory,
  computeNextReviewEntry,
  computeQuizAccuracy,
  computeStreakDays,
  computeWeekActivity,
} from "./progress";

describe("buildOpenedTermHistory", () => {
  it("appends a first-time term", () => {
    expect(buildOpenedTermHistory(["attention"], "transformer")).toEqual(["attention", "transformer"]);
  });

  it("moves a reopened term to the end so recency is real", () => {
    expect(buildOpenedTermHistory(["attention", "transformer", "embedding"], "attention")).toEqual([
      "transformer",
      "embedding",
      "attention",
    ]);
  });
});

describe("computeNextReviewEntry", () => {
  it("schedules a first correct answer one day out", () => {
    const entry = computeNextReviewEntry("attention", undefined, true, new Date("2026-07-04T12:00:00Z"));
    expect(entry.box).toBe(1);
    expect(entry.dueAt).toBe("2026-07-05T12:00:00.000Z");
  });

  it("advances correct answers through the review boxes", () => {
    const entry = computeNextReviewEntry(
      "attention",
      { termSlug: "attention", box: 2, dueAt: "2026-07-04T12:00:00.000Z" },
      true,
      new Date("2026-07-04T12:00:00Z"),
    );
    expect(entry.box).toBe(3);
    expect(entry.dueAt).toBe("2026-07-11T12:00:00.000Z");
  });

  it("keeps incorrect answers in the near-term review box", () => {
    const entry = computeNextReviewEntry(
      "attention",
      { termSlug: "attention", box: 4, dueAt: "2026-07-20T12:00:00.000Z" },
      false,
      new Date("2026-07-04T12:00:00Z"),
    );
    expect(entry.box).toBe(1);
    expect(entry.dueAt).toBe("2026-07-05T12:00:00.000Z");
  });
});

describe("computeStreakDays", () => {
  it("returns 0 for no activity", () => {
    expect(computeStreakDays([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const now = new Date("2026-07-04T12:00:00Z");
    const dates = ["2026-07-02", "2026-07-03", "2026-07-04"];
    expect(computeStreakDays(dates, now)).toBe(3);
  });

  it("keeps yesterday's streak alive if today has no activity yet", () => {
    const now = new Date("2026-07-04T08:00:00Z");
    const dates = ["2026-07-02", "2026-07-03"];
    expect(computeStreakDays(dates, now)).toBe(2);
  });

  it("resets to 0 when there is a gap", () => {
    const now = new Date("2026-07-04T12:00:00Z");
    const dates = ["2026-06-20", "2026-07-04"];
    expect(computeStreakDays(dates, now)).toBe(1);
  });
});

describe("computeQuizAccuracy", () => {
  it("returns null with no attempts", () => {
    expect(computeQuizAccuracy([])).toBeNull();
  });

  it("computes rounded percent correct", () => {
    const attempts = [
      { termSlug: "a", blockId: "quick-quiz", correct: true, at: "" },
      { termSlug: "b", blockId: "quick-quiz", correct: true, at: "" },
      { termSlug: "c", blockId: "quick-quiz", correct: false, at: "" },
    ];
    expect(computeQuizAccuracy(attempts)).toBe(67);
  });
});

describe("computeWeekActivity", () => {
  it("returns 7 days oldest-first with correct active flags", () => {
    const now = new Date("2026-07-04T12:00:00Z");
    const dates = ["2026-07-03", "2026-07-04"];
    const week = computeWeekActivity(dates, now);
    expect(week).toHaveLength(7);
    expect(week[0].date).toBe("2026-06-28");
    expect(week[6].date).toBe("2026-07-04");
    expect(week[5].active).toBe(true);
    expect(week[6].active).toBe(true);
    expect(week[0].active).toBe(false);
  });
});
