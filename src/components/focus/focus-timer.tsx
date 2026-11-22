"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logFocusSession } from "@/app/actions/focus";
import { PriorityDot } from "@/components/tasks/priority-dot";
import {
  advance,
  chooseTask,
  choosePhase,
  formatClock,
  pause,
  PHASE_LABEL,
  PHASE_MINUTES,
  PHASES,
  remainingMs,
  reset,
  SESSIONS_PER_CYCLE,
  start,
  type SessionLog,
} from "@/lib/focus/timer";
import type { FocusData } from "@/lib/focus/queries";
import { syncChime, unlockAudio } from "./chime";
import { getFocus, updateFocus, useFocusStore } from "./focus-store";

const RADIUS = 156;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = FocusData & { initialTaskId: string | null };

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** Ends the running phase if its time is up: logs it and readies the next one. */
function finishIfDue(now: number) {
  const { timer } = getFocus();
  if (timer.status !== "running" || timer.endsAt === null || now < timer.endsAt) return;
  const { state, log } = advance(timer, now);
  updateFocus((s) => ({ ...s, timer: state, pending: log ? [...s.pending, log] : s.pending }));
}

export function FocusTimer({ tasks, todaySeconds, initialTaskId }: Props) {
  const { timer, pending, muted } = useFocusStore();
  const [now, setNow] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [, startTransition] = useTransition();
  const stage = useRef<HTMLDivElement>(null);
  const sending = useRef(new Set<string>());

  const running = timer.status === "running";
  const left = running && now > 0 ? remainingMs(timer, now) : timer.remainingMs;
  const clock = formatClock(left);
  const started = timer.startedAt !== null;
  const task = tasks.find((t) => t.id === timer.taskId) ?? null;

  // Tick while running. Time comes from timestamps, so throttled ticks in a
  // background tab only delay the display, never the result.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      finishIfDue(t);
    };
    const frame = requestAnimationFrame(tick);
    const id = setInterval(tick, 250);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [running]);

  // Keep the end-of-phase chime scheduled to match the timer. It's scheduled
  // on the audio clock, so it plays on time even in a throttled background
  // tab, and keeps going if you navigate to another page meanwhile.
  useEffect(() => {
    syncChime(timer.phase === "work" ? "work-end" : "break-end", running && !muted ? timer.endsAt : null);
  });
  // Audio may only start after a gesture; any click or key here unlocks it
  // (needed when a running timer was restored after a reload).
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Opened from a task's "Start focus" button.
  useEffect(() => {
    const { timer: t } = getFocus();
    if (initialTaskId && t.startedAt === null && t.taskId !== initialTaskId && tasks.some((x) => x.id === initialTaskId)) {
      updateFocus((s) => ({ ...s, timer: chooseTask(s.timer, initialTaskId) }));
    }
  }, [initialTaskId, tasks]);

  // Send finished sessions; keep them until the server confirms. Network
  // failures are retried when the browser comes back online; logs the server
  // can never accept are dropped instead of retried forever.
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const onOnline = () => setRetry((n) => n + 1);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  useEffect(() => {
    for (const log of pending) {
      if (sending.current.has(log.id)) continue;
      sending.current.add(log.id);
      startTransition(async () => {
        let result: { ok: boolean; permanent?: boolean } = { ok: false };
        try {
          result = await logFocusSession(log);
        } catch {
          // Offline: keep it for the next retry.
        }
        sending.current.delete(log.id);
        if (result.ok || result.permanent) {
          updateFocus((s) => ({ ...s, pending: s.pending.filter((p) => p.id !== log.id) }));
        }
      });
    }
  }, [pending, retry]);

  useEffect(() => {
    if (!running) return;
    const previous = document.title;
    document.title = `${clock} · ${PHASE_LABEL[timer.phase]}`;
    return () => {
      document.title = previous;
    };
  }, [running, clock, timer.phase]);

  function queue(log: SessionLog | null) {
    return (s: ReturnType<typeof getFocus>) => (log ? [...s.pending, log] : s.pending);
  }

  function toggle() {
    unlockAudio();
    const t = Date.now();
    setNow(t);
    updateFocus((s) => ({ ...s, timer: s.timer.status === "running" ? pause(s.timer, t) : start(s.timer, t, crypto.randomUUID()),
    }));
  }

  function resetTimer() {
    const { state, log } = reset(getFocus().timer, Date.now());
    updateFocus((s) => ({ ...s, timer: state, pending: queue(log)(s) }));
  }

  function skip() {
    const { state, log } = advance(getFocus().timer, Date.now());
    updateFocus((s) => ({ ...s, timer: state, pending: queue(log)(s) }));
  }

  function toggleMute() {
    updateFocus((s) => ({ ...s, muted: !s.muted }));
  }

  async function toggleImmersive() {
    if (immersive) {
      setImmersive(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      return;
    }
    setImmersive(true);
    // iPhone Safari has no element full screen; the overlay alone covers it.
    await stage.current?.requestFullscreen?.().catch(() => {});
  }

  // Leaving full screen with Esc also leaves immersive mode.
  useEffect(() => {
    const onChange = () => !document.fullscreenElement && setImmersive(false);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const keys = useRef({ toggle, toggleMute, toggleImmersive, immersive });
  useEffect(() => {
    keys.current = { toggle, toggleMute, toggleImmersive, immersive };
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const k = keys.current;
      if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        k.toggle();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        void k.toggleImmersive();
      } else if (e.key === "m" || e.key === "M") {
        k.toggleMute();
      } else if (e.key === "Escape" && k.immersive && !document.fullscreenElement) {
        void k.toggleImmersive();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pendingWork = pending.filter((p) => p.kind === "work").reduce((sum, p) => sum + p.durationSeconds, 0);
  const minutesToday = Math.round((todaySeconds + pendingWork) / 60);
  const fraction = timer.durationMs > 0 ? left / timer.durationMs : 0;
  const endsAt = running && timer.endsAt ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(timer.endsAt) : null;
  const status = running ? `ends ${endsAt}` : timer.status === "paused" ? "paused" : `${PHASE_MINUTES[timer.phase]} min`;
  const leftSeconds = Math.ceil(left / 1000);
  const progressLabel =
    timer.phase === "work"
      ? `Session ${timer.cycleCount + 1} of ${SESSIONS_PER_CYCLE}`
      : `${timer.cycleCount} of ${SESSIONS_PER_CYCLE} sessions done`;

  return (
    <div
      ref={stage}
      className={
        immersive
          ? "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-10 overflow-y-auto bg-bg px-4 py-8"
          : "flex flex-col items-center gap-9 pt-2"
      }
    >
      <div className={`flex items-center gap-2 ${immersive ? "absolute top-4 right-4" : "absolute top-0 right-0"}`}>
        <IconButton label={muted ? "Unmute chimes" : "Mute chimes"} pressed={muted} onClick={toggleMute}>
          {muted ? (
            <path d="M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6" />
          ) : (
            <path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7" />
          )}
        </IconButton>
        <IconButton label={immersive ? "Exit full screen" : "Full-screen focus"} onClick={() => void toggleImmersive()}>
          {immersive ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
        </IconButton>
      </div>

      {!immersive ? (
        <div role="radiogroup" aria-label="Timer preset" className="flex w-full max-w-sm rounded-[11px] bg-chip p-[3px] sm:w-auto sm:max-w-none">
          {PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              role="radio"
              aria-checked={timer.phase === phase}
              disabled={started && timer.phase !== phase}
              onClick={() => updateFocus((s) => ({ ...s, timer: choosePhase(s.timer, phase) }))}
              className={`h-9 flex-1 rounded-lg px-3 text-sm whitespace-nowrap disabled:opacity-40 sm:px-4 ${
                timer.phase === phase ? "bg-seg font-semibold text-fg shadow-sm" : "text-muted"
              }`}
            >
              {/* "Short · 5" on phones, "Short break · 5" with room. */}
              {PHASE_LABEL[phase].split(" ")[0]}
              {phase === "work" ? "" : <span className="max-sm:hidden"> break</span>} · {PHASE_MINUTES[phase]}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`relative flex aspect-square items-center justify-center ${immersive ? "w-[min(560px,82vmin)]" : "w-[min(340px,82vw)]"}`}>
        <svg aria-hidden="true" viewBox="0 0 340 340" className="absolute inset-0 size-full -rotate-90">
          <circle cx="170" cy="170" r={RADIUS} fill="none" stroke="var(--track)" strokeWidth="10" />
          <circle
            cx="170"
            cy="170"
            r={RADIUS}
            fill="none"
            stroke="var(--fg)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
        </svg>
        <div
          role="timer"
          aria-label={`${Math.floor(leftSeconds / 60)} minutes ${leftSeconds % 60} seconds left`}
          className="relative flex flex-col items-center gap-1.5"
        >
          <span className={`leading-none font-medium tracking-tight tabular-nums ${immersive ? "text-[clamp(64px,16vmin,120px)]" : "text-[clamp(56px,17vw,72px)]"}`}>
            {clock}
          </span>
          <span className="text-[15px] text-muted">
            {PHASE_LABEL[timer.phase]} · {status}
          </span>
        </div>
      </div>

      <label className="relative flex h-9 max-w-[min(360px,90vw)] items-center gap-2 rounded-full border border-line px-3.5 text-sm">
        <span className="sr-only">Task</span>
        {task ? <PriorityDot priority={task.priority} label={false} /> : null}
        <span className="truncate">{task?.title ?? "No task"}</span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M6 9l6 6 6-6" />
        </svg>
        {/* A native select keeps the picker accessible and phone-friendly. */}
        <select
          value={task?.id ?? ""}
          onChange={(e) => updateFocus((s) => ({ ...s, timer: chooseTask(s.timer, e.target.value || null) }))}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="">No task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-7">
        <RoundButton label="Reset timer" onClick={resetTimer} disabled={!started}>
          <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />
        </RoundButton>
        <button
          type="button"
          onClick={toggle}
          aria-label={running ? "Pause" : started ? "Resume" : "Start"}
          className="flex size-[76px] items-center justify-center rounded-full bg-inv text-inv-fg transition-transform active:scale-95"
        >
          {running ? (
            <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
              <path d="M9 5v14M15 5v14" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5">
              <path d="M7 4.5l13 7.5-13 7.5z" />
            </svg>
          )}
        </button>
        <RoundButton label={timer.phase === "work" ? "Skip to break" : "Skip to work"} onClick={skip}>
          <path d="M6 5l10 7-10 7zM19 5v14" />
        </RoundButton>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <div aria-hidden="true" className="flex gap-2">
          {Array.from({ length: SESSIONS_PER_CYCLE }, (_, i) => (
            <span
              key={i}
              className={`size-2.5 rounded-full ${
                i < timer.cycleCount
                  ? "bg-fg"
                  : i === timer.cycleCount && timer.phase === "work" && started
                    ? "border-2 border-fg"
                    : "bg-track"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted">
          {progressLabel} · {minutesToday} min focused today
        </span>
      </div>

      <p className="hidden text-[13px] text-muted md:block">
        <Kbd>Space</Kbd> {running ? "pause" : "start"} · <Kbd>F</Kbd> full screen · <Kbd>M</Kbd> {muted ? "unmute" : "mute"}
      </p>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-line px-1.5 py-0.5 font-sans text-xs">{children}</kbd>;
}

function IconButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-xl border border-line bg-bg"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function RoundButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-[52px] items-center justify-center rounded-full border border-line bg-bg transition-opacity disabled:opacity-40"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}
