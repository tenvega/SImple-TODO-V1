import type { Metadata } from "next";

export const metadata: Metadata = { title: "Insights" };

// Placeholder until its stage is built.
export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">Insights</h1>
      <p className="text-muted">Weekly focus and completion trends land after Focus.</p>
    </div>
  );
}
