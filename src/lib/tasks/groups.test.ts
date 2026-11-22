import { describe, expect, it } from "vitest";
import { belongsTo, groupTasks } from "./groups";
import type { Task } from "./types";

const NY = "America/New_York";
const now = new Date("2026-11-21T15:00:00Z"); // Sat Nov 21, 10 AM in NY

let n = 0;
function task(partial: Partial<Task>): Task {
  n += 1;
  return {
    id: `t${n}`,
    title: `Task ${n}`,
    notes: null,
    dueAt: null,
    dueHasTime: true,
    priority: "none",
    completedAt: null,
    tags: [],
    focusCount: 0,
    focusSeconds: 0,
    ...partial,
  };
}

describe("today", () => {
  it("splits overdue from today and keeps today's completions at the end", () => {
    const overdue = task({ title: "Overdue", dueAt: "2026-11-19T22:00:00+00:00" });
    const later = task({ title: "Later", dueAt: "2026-11-21T20:00:00+00:00", priority: "low" });
    const sooner = task({ title: "Sooner", dueAt: "2026-11-21T16:00:00+00:00" });
    const doneToday = task({ title: "Run", dueAt: "2026-11-21T12:00:00+00:00", completedAt: "2026-11-21T12:42:00+00:00" });
    const doneYesterday = task({ dueAt: "2026-11-20T12:00:00+00:00", completedAt: "2026-11-20T13:00:00+00:00" });
    const tomorrow = task({ dueAt: "2026-11-22T15:00:00+00:00" });

    const sections = groupTasks("today", [later, doneToday, overdue, tomorrow, sooner, doneYesterday], now, NY);
    expect(sections.map((s) => s.title)).toEqual(["Overdue", "Today"]);
    expect(sections[0].tasks.map((t) => t.title)).toEqual(["Overdue"]);
    expect(sections[1].tasks.map((t) => t.title)).toEqual(["Sooner", "Later", "Run"]);
  });

  it("uses the visitor's day, not UTC's", () => {
    // 11 PM Saturday in New York is already Sunday in UTC.
    const lateTonight = task({ dueAt: "2026-11-22T04:00:00Z" });
    expect(belongsTo("today", lateTonight, now, NY)).toBe(true);
    expect(belongsTo("today", lateTonight, now, "UTC")).toBe(false);
  });

  it("shows no section title when nothing is overdue", () => {
    const sections = groupTasks("today", [task({ dueAt: "2026-11-21T20:00:00Z" })], now, NY);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBeNull();
  });
});

describe("upcoming", () => {
  it("groups by day for a week, then by month", () => {
    const tasks = [
      task({ dueAt: "2026-11-22T15:00:00Z" }),
      task({ dueAt: "2026-11-24T15:00:00Z" }),
      task({ dueAt: "2026-11-24T18:00:00Z" }),
      task({ dueAt: "2026-12-15T15:00:00Z" }),
      task({ dueAt: "2026-12-20T15:00:00Z" }),
      task({ dueAt: "2026-11-21T20:00:00Z" }), // today: not upcoming
    ];
    const sections = groupTasks("upcoming", tasks, now, NY);
    expect(sections.map((s) => [s.title, s.tasks.length])).toEqual([
      ["Tomorrow", 1],
      ["Tuesday", 2],
      ["December 2026", 2],
    ]);
  });
});

describe("all and completed", () => {
  it("puts undated tasks last", () => {
    const sections = groupTasks("all", [task({}), task({ dueAt: "2026-11-30T15:00:00Z" })], now, NY);
    expect(sections.map((s) => s.title)).toEqual(["Scheduled", "No date"]);
  });

  it("lists completions newest first, by day", () => {
    const tasks = [
      task({ title: "old", completedAt: "2026-11-19T15:00:00Z" }),
      task({ title: "new", completedAt: "2026-11-21T14:00:00Z" }),
      task({ title: "open" }),
    ];
    const sections = groupTasks("completed", tasks, now, NY);
    expect(sections.map((s) => s.title)).toEqual(["Today", "Thu, Nov 19"]);
  });
});
