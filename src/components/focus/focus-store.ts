"use client";

import { useSyncExternalStore } from "react";
import { createTimer, restore, type SessionLog, type TimerState } from "@/lib/focus/timer";

/**
 * The timer lives outside React, in localStorage, so it survives reloads and
 * navigation: start a session, go check Today, come back and it's still
 * running. Unsent session logs are kept too and retried.
 */
type FocusStore = { timer: TimerState; pending: SessionLog[]; muted: boolean };

const KEY = "taskflow:focus";
const SERVER: FocusStore = { timer: createTimer(), pending: [], muted: false };

let current: FocusStore | null = null;
const listeners = new Set<() => void>();

export function getFocus(): FocusStore {
  if (current) return current;
  current = SERVER;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const timer = restore(saved?.timer);
    if (timer) {
      current = {
        timer,
        pending: Array.isArray(saved.pending) ? saved.pending.slice(-20) : [],
        muted: saved.muted === true,
      };
    }
  } catch {
    // Private mode or corrupt data: start fresh.
  }
  return current;
}

export function updateFocus(change: (s: FocusStore) => FocusStore) {
  current = change(getFocus());
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Not persisted; still works for this page view.
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the timer.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFocusStore(): FocusStore {
  return useSyncExternalStore(subscribe, getFocus, () => SERVER);
}
