"use client";

/**
 * Chimes for the end of a focus or break period. Drop audio files into
 * public/sounds (see the README there) to replace the built-in tones; until
 * then a short synthesized bell plays.
 */
export type Chime = "work-end" | "break-end";

const missing = new Set<Chime>();

export async function playChime(chime: Chime): Promise<void> {
  if (!missing.has(chime)) {
    try {
      const audio = new Audio(`/sounds/${chime}.mp3`);
      audio.volume = 0.8;
      await audio.play();
      return;
    } catch {
      missing.add(chime);
    }
  }
  bell(chime === "work-end" ? [880, 1318.5] : [659.3, 987.8]);
}

let context: AudioContext | null = null;

/** Two soft sine partials with a bell-like decay. */
function bell(frequencies: number[]) {
  try {
    context ??= new AudioContext();
    const t = context.currentTime;
    frequencies.forEach((frequency, i) => {
      const osc = context!.createOscillator();
      const gain = context!.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      const at = t + i * 0.18;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
      osc.connect(gain).connect(context!.destination);
      osc.start(at);
      osc.stop(at + 1.7);
    });
  } catch {
    // No audio available; the visual change is enough.
  }
}
