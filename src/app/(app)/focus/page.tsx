import type { Metadata } from "next";

export const metadata: Metadata = { title: "Focus" };

// Placeholder until its stage is built.
export default function FocusPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">Focus</h1>
      <p className="text-muted">A full-screen timer with work and break presets lands in the next stage.</p>
    </div>
  );
}
