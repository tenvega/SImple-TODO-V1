/**
 * Pomodoro timer as pure functions over plain data, so it can be saved to
 * localStorage, restored after a reload, and unit tested. Time is always
 * computed from timestamps, never by counting ticks, so a throttled
 * background tab can't drift.
 */

export const PHASES = ["work", "short_break", "long_break"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_MINUTES: Record<Phase, number> = { work: 25, short_break: 5, long_break: 15 };
export const PHASE_LABEL: Record<Phase, string> = { work: "Work", short_break: "Short break", long_break: "Long break" };
export const SESSIONS_PER_CYCLE = 4;
/** Shorter runs are treated as false starts and not logged. */
const MIN_LOGGED_SECONDS = 60;

export type TimerState = {
  phase: Phase;
  status: "idle" | "running" | "paused";
  durationMs: number;
  /** Set while running. */
  endsAt: number | null;
  /** Set while idle or paused. */
  remainingMs: number;
  /** First start of this phase, for the session log. */
  startedAt: number | null;
  /** Work sessions finished in the current cycle. */
  cycleCount: number;
  taskId: string | null;
};

export type SessionLog = {
  id: string;
  kind: Phase;
  taskId: string | null;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  completed: boolean;
};

export function createTimer(phase: Phase = "work", cycleCount = 0, taskId: string | null = null): TimerState {
  const durationMs = PHASE_MINUTES[phase] * 60_000;
  return { phase, status: "idle", durationMs, endsAt: null, remainingMs: durationMs, startedAt: null, cycleCount, taskId };
}

export function remainingMs(s: TimerState, now: number): number {
  return s.status === "running" && s.endsAt !== null ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

export function start(s: TimerState, now: number): TimerState {
  if (s.status === "running") return s;
  return { ...s, status: "running", endsAt: now + s.remainingMs, startedAt: s.startedAt ?? now };
}

export function pause(s: TimerState, now: number): TimerState {
  if (s.status !== "running") return s;
  return { ...s, status: "paused", endsAt: null, remainingMs: remainingMs(s, now) };
}

/** Picks a preset. Only allowed before the current phase has started. */
export function choosePhase(s: TimerState, phase: Phase): TimerState {
  return s.startedAt === null ? createTimer(phase, s.cycleCount, s.taskId) : s;
}

export function chooseTask(s: TimerState, taskId: string | null): TimerState {
  return { ...s, taskId };
}

function nextPhase(s: TimerState, workDone: boolean): { phase: Phase; cycleCount: number } {
  if (s.phase === "work") {
    const cycleCount = workDone ? s.cycleCount + 1 : s.cycleCount;
    return { phase: cycleCount >= SESSIONS_PER_CYCLE ? "long_break" : "short_break", cycleCount };
  }
  // A long break closes the cycle.
  return { phase: "work", cycleCount: s.phase === "long_break" ? 0 : s.cycleCount };
}

function logFor(s: TimerState, endedAt: number, completed: boolean, id: string): SessionLog | null {
  if (s.startedAt === null) return null;
  const seconds = Math.round((s.durationMs - remainingMs(s, endedAt)) / 1000);
  if (seconds < MIN_LOGGED_SECONDS || endedAt <= s.startedAt) return null;
  return {
    id,
    kind: s.phase,
    taskId: s.taskId,
    startedAt: new Date(s.startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    durationSeconds: Math.min(seconds, 7200),
    completed,
  };
}

/**
 * Ends the current phase, either because time ran out (`completed`) or
 * because the user skipped. Returns the next phase, ready to start, and the
 * log entry for what just ended, if it is worth keeping.
 */
export function advance(
  s: TimerState,
  now: number,
  id: string,
): { state: TimerState; log: SessionLog | null; completed: boolean } {
  const completed = s.status === "running" && s.endsAt !== null && now >= s.endsAt;
  const endedAt = completed ? s.endsAt! : now;
  const log = logFor(s, endedAt, completed, id);
  const next = nextPhase(s, completed);
  return { state: createTimer(next.phase, next.cycleCount, s.taskId), log, completed };
}

/** Back to the start of the current phase. A long enough partial run is still logged. */
export function reset(s: TimerState, now: number, id: string): { state: TimerState; log: SessionLog | null } {
  return { state: createTimer(s.phase, s.cycleCount, s.taskId), log: logFor(s, now, false, id) };
}

/** Accepts only well-formed saved state; anything else starts fresh. */
export function restore(value: unknown): TimerState | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const num = (x: unknown) => typeof x === "number" && Number.isFinite(x);
  const ok =
    PHASES.includes(v.phase as Phase) &&
    ["idle", "running", "paused"].includes(v.status as string) &&
    num(v.durationMs) &&
    num(v.remainingMs) &&
    (v.endsAt === null || num(v.endsAt)) &&
    (v.startedAt === null || num(v.startedAt)) &&
    num(v.cycleCount) &&
    (v.taskId === null || typeof v.taskId === "string") &&
    (v.status !== "running" || v.endsAt !== null);
  return ok ? (v as TimerState) : null;
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
