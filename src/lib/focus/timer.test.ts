import { describe, expect, it } from "vitest";
import {
  advance,
  choosePhase,
  createTimer,
  formatClock,
  pause,
  remainingMs,
  reset,
  restore,
  start,
  type TimerState,
} from "./timer";

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 22, 15, 0);

describe("running and pausing", () => {
  it("counts down from timestamps", () => {
    const s = start(createTimer("work"), T0, "log-1");
    expect(remainingMs(s, T0 + 10 * MIN)).toBe(15 * MIN);
    expect(remainingMs(s, T0 + 30 * MIN)).toBe(0);
  });

  it("freezes while paused and resumes where it left off", () => {
    let s = start(createTimer("work"), T0, "log-1");
    s = pause(s, T0 + 5 * MIN);
    expect(remainingMs(s, T0 + 60 * MIN)).toBe(20 * MIN);
    s = start(s, T0 + 60 * MIN, "log-1");
    expect(remainingMs(s, T0 + 70 * MIN)).toBe(10 * MIN);
    expect(s.startedAt).toBe(T0);
  });

  it("only lets you switch presets before starting", () => {
    const idle = choosePhase(createTimer("work"), "short_break");
    expect(idle.phase).toBe("short_break");
    expect(idle.durationMs).toBe(5 * MIN);
    const running = start(createTimer("work"), T0, "log-1");
    expect(choosePhase(running, "long_break").phase).toBe("work");
  });
});

describe("finishing a phase", () => {
  it("logs a completed work session with its focused time and task", () => {
    const s = start(createTimer("work", 0, "task-1"), T0, "log-1");
    const { state, log, completed } = advance(s, T0 + 26 * MIN);
    expect(completed).toBe(true);
    expect(log).toEqual({
      id: "log-1",
      kind: "work",
      taskId: "task-1",
      startedAt: new Date(T0).toISOString(),
      endedAt: new Date(T0 + 25 * MIN).toISOString(),
      durationSeconds: 1500,
      completed: true,
    });
    expect(state.phase).toBe("short_break");
    expect(state.cycleCount).toBe(1);
    expect(state.status).toBe("idle");
    expect(state.taskId).toBe("task-1");
  });

  it("excludes paused time from the logged duration", () => {
    let s = start(createTimer("work"), T0, "log-1");
    s = pause(s, T0 + 10 * MIN);
    s = start(s, T0 + 40 * MIN, "log-1");
    const { log } = advance(s, T0 + 55 * MIN);
    expect(log?.durationSeconds).toBe(1500);
    expect(log?.endedAt).toBe(new Date(T0 + 55 * MIN).toISOString());
  });

  it("suggests a long break after every fourth work session", () => {
    let s: TimerState = createTimer("work", 3);
    s = advance(start(s, T0, "a"), T0 + 25 * MIN).state;
    expect(s.phase).toBe("long_break");
    s = advance(start(s, T0 + 25 * MIN, "b"), T0 + 40 * MIN).state;
    expect(s.phase).toBe("work");
    expect(s.cycleCount).toBe(0);
  });

  it("logs a skipped run as incomplete and doesn't count it toward the cycle", () => {
    const s = start(createTimer("work", 1), T0, "log-1");
    const { state, log, completed } = advance(s, T0 + 12 * MIN);
    expect(completed).toBe(false);
    expect(log?.completed).toBe(false);
    expect(log?.durationSeconds).toBe(720);
    expect(state.phase).toBe("short_break");
    expect(state.cycleCount).toBe(1);
  });

  it("doesn't log false starts", () => {
    const s = start(createTimer("work"), T0, "log-1");
    expect(advance(s, T0 + 30_000).log).toBeNull();
    expect(reset(s, T0 + 30_000).log).toBeNull();
    expect(advance(createTimer("work"), T0).log).toBeNull();
  });

  it("resets to the same phase, logging a long enough partial run", () => {
    const s = start(createTimer("work", 2), T0, "log-1");
    const { state, log } = reset(s, T0 + 8 * MIN);
    expect(state.phase).toBe("work");
    expect(state.status).toBe("idle");
    expect(state.cycleCount).toBe(2);
    expect(log?.durationSeconds).toBe(480);
  });
});

describe("log IDs", () => {
  it("keeps the first start's ID across pause and resume, so every tab logs the same ID", () => {
    let s = start(createTimer("work"), T0, "first");
    s = pause(s, T0 + MIN);
    s = start(s, T0 + 2 * MIN, "second");
    expect(advance(s, T0 + 30 * MIN).log?.id).toBe("first");
    // A copy of the same saved state (another tab) produces the same log.
    const copy = JSON.parse(JSON.stringify(s));
    expect(advance(copy, T0 + 30 * MIN).log?.id).toBe("first");
  });

  it("starts the next phase without an ID", () => {
    const s = start(createTimer("work"), T0, "first");
    expect(advance(s, T0 + 30 * MIN).state.logId).toBeNull();
  });
});

describe("restore", () => {
  it("round-trips saved state", () => {
    const s = start(createTimer("work", 1, "t"), T0, "log-1");
    expect(restore(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it("accepts state saved before log IDs existed", () => {
    const old: Partial<ReturnType<typeof createTimer>> = createTimer("work");
    delete old.logId;
    expect(restore(old)?.logId).toBeNull();
  });

  it("rejects anything malformed", () => {
    expect(restore(null)).toBeNull();
    expect(restore({ ...createTimer(), phase: "nap" })).toBeNull();
    expect(restore({ ...createTimer(), status: "running", endsAt: null })).toBeNull();
    expect(restore({ ...createTimer(), remainingMs: "lots" })).toBeNull();
  });
});

it("formats the clock, rounding up partial seconds", () => {
  expect(formatClock(25 * MIN)).toBe("25:00");
  expect(formatClock(932_100)).toBe("15:33");
  expect(formatClock(0)).toBe("0:00");
});
