"use client";

/**
 * Chimes for the end of a focus or break period.
 *
 * The sound is scheduled on the Web Audio clock for the exact end time as
 * soon as the timer starts. Browsers throttle timers in background tabs (to
 * once a minute after a while), but not the audio clock, so the chime still
 * lands on time while you're in another tab, which is when it matters.
 *
 * Drop audio files into public/sounds (see the README there) to replace the
 * built-in tones; until then a short synthesized bell plays.
 */
export type Chime = "work-end" | "break-end";

let context: AudioContext | null = null;
const buffers = new Map<Chime, Promise<AudioBuffer | null>>();
let scheduled: { key: string; at: number; nodes: AudioScheduledSourceNode[] } | null = null;
let generation = 0;

/**
 * Creates or resumes the audio context. Call from a click or key handler:
 * browsers only allow audio to start after a user gesture.
 */
export function unlockAudio() {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
  } catch {
    // No Web Audio; the timer still works, silently.
  }
}

function loadBuffer(ctx: AudioContext, chime: Chime): Promise<AudioBuffer | null> {
  let pending = buffers.get(chime);
  if (!pending) {
    pending = fetch(`/sounds/${chime}.mp3`)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((data) => (data ? ctx.decodeAudioData(data) : null))
      .catch(() => null);
    buffers.set(chime, pending);
  }
  return pending;
}

/** Two soft sine partials with a bell-like decay, starting at `when`. */
function bell(ctx: AudioContext, frequencies: number[], when: number): AudioScheduledSourceNode[] {
  return frequencies.map((frequency, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const at = when + i * 0.18;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 1.7);
    return osc;
  });
}

/** Stops a chime that hasn't played yet; one that's already sounding rings out. */
function cancel() {
  generation += 1;
  const upcoming = scheduled !== null && scheduled.at > Date.now();
  for (const node of upcoming ? scheduled!.nodes : []) {
    try {
      node.stop();
    } catch {
      // Already stopped.
    }
  }
  scheduled = null;
}

/**
 * Makes the scheduled chime match the timer: `at` is the end time in epoch
 * milliseconds, or null when nothing should play (paused, idle, muted).
 * Calling it again with the same chime and time is a no-op, so it's safe to
 * call on every render.
 */
export function syncChime(chime: Chime, at: number | null) {
  const key = at === null ? null : `${chime}@${at}`;
  if (key === (scheduled?.key ?? null)) return;
  cancel();
  // Nothing to schedule, no audio yet, or a phase that ended long ago (no
  // late chime for a session that finished while the tab was closed).
  if (key === null || at === null || !context || at < Date.now() - 5_000) return;

  const ctx = context;
  const mine = generation;
  scheduled = { key, at, nodes: [] };
  void loadBuffer(ctx, chime).then((buffer) => {
    if (mine !== generation) return; // Cancelled while the file loaded.
    const when = ctx.currentTime + Math.max(0, (at - Date.now()) / 1000);
    if (buffer) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = 0.8;
      source.buffer = buffer;
      source.connect(gain).connect(ctx.destination);
      source.start(when);
      scheduled = { key, at, nodes: [source] };
    } else {
      scheduled = { key, at, nodes: bell(ctx, chime === "work-end" ? [880, 1318.5] : [659.3, 987.8], when) };
    }
  });
}
