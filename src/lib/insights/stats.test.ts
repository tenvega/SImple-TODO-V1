import { describe, expect, it } from "vitest";
import { computeInsights, formatDuration, type InsightsInput } from "./stats";

const NY = "America/New_York";
// Saturday Nov 21 2026, 3 PM in New York.
const now = new Date("2026-11-21T20:00:00Z");
/** Noon New York time, `daysAgo` days before `now`. */
const at = (daysAgo: number, hour = 12) =>
  new Date(Date.UTC(2026, 10, 21 - daysAgo, hour + 5)).toISOString();

function run(partial: Partial<InsightsInput>) {
  return computeInsights({ completions: [], sessions: [], due: [], now, timeZone: NY, range: "week", ...partial });
}

describe("computeInsights", () => {
  it("buckets by the visitor's day and compares with the week before", () => {
    const s = run({
      completions: [at(0), at(3), at(3), at(3), at(6), at(7), at(13), at(20)],
      sessions: [
        { endedAt: at(3), seconds: 1500 },
        { endedAt: at(3), seconds: 1500 },
        { endedAt: at(9), seconds: 1500 },
      ],
    });
    expect(s.days).toHaveLength(7);
    expect(s.days.at(-1)?.isToday).toBe(true);
    expect(s.days.map((d) => d.tasks)).toEqual([1, 0, 0, 3, 0, 0, 1]);
    expect(s.tasksDone).toBe(5);
    expect(s.tasksBefore).toBe(2);
    expect(s.focusSeconds).toBe(3000);
    expect(s.focusSessions).toBe(2);
    expect(s.bestDay?.key).toBe("2026-11-18");
    expect(s.summary).toBe("You finished 5 tasks this week, 3 more than last week. Wednesday was your most productive day.");
  });

  it("puts a late-evening completion on the local day, not the UTC day", () => {
    // 11:30 PM Friday in New York is Saturday in UTC.
    const s = run({ completions: ["2026-11-21T04:30:00Z"] });
    expect(s.days.find((d) => d.key === "2026-11-20")?.tasks).toBe(1);
  });

  it("counts streaks, letting an empty today keep yesterday's streak alive", () => {
    const s = run({ completions: [at(1), at(2), at(3), at(10), at(11), at(12), at(13), at(14)] });
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(5);
    expect(run({ completions: [at(2)] }).streak).toBe(0);
  });

  it("counts focus-only days toward the streak", () => {
    expect(run({ completions: [at(0)], sessions: [{ endedAt: at(1), seconds: 600 }] }).streak).toBe(2);
  });

  it("reports the completion rate of tasks due in the period", () => {
    const s = run({ due: [{ completedAt: at(1) }, { completedAt: null }, { completedAt: at(2) }] });
    expect([s.dueDone, s.dueCount]).toEqual([2, 3]);
  });

  it("covers 30 days for the month view and words the summary to match", () => {
    const s = run({ range: "month", completions: [at(0), at(29), at(30), at(45)] });
    expect(s.days).toHaveLength(30);
    expect(s.tasksDone).toBe(2);
    expect(s.tasksBefore).toBe(2);
    expect(s.summary).toMatch(/^You finished 2 tasks in the last 30 days, the same as the 30 days before\./);
  });

  it("falls back to focus time, then to an empty-state line", () => {
    expect(run({ sessions: [{ endedAt: at(1), seconds: 3000 }] }).summary).toBe(
      "You focused for 50m this week across 1 session.",
    );
    expect(run({}).summary).toMatch(/^Nothing logged this week yet/);
  });
});

it("formats durations", () => {
  expect(formatDuration(24_000)).toBe("6h 40m");
  expect(formatDuration(3_660)).toBe("1h 01m");
  expect(formatDuration(2_700)).toBe("45m");
  expect(formatDuration(0)).toBe("0m");
});
