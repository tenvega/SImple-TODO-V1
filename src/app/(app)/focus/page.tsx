import type { Metadata } from "next";
import { Suspense } from "react";
import { FocusTimer } from "@/components/focus/focus-timer";
import { requireUser } from "@/lib/auth";
import { getFocusData } from "@/lib/focus/queries";

export const metadata: Metadata = { title: "Focus" };

export default function FocusPage({ searchParams }: PageProps<"/focus">) {
  return (
    <div className="relative flex flex-col gap-6">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">Focus</h1>
      <Suspense fallback={<FocusSkeleton />}>
        <FocusLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FocusLoader({ searchParams }: { searchParams: PageProps<"/focus">["searchParams"] }) {
  await requireUser();
  const [data, params] = await Promise.all([getFocusData(), searchParams]);
  const task = typeof params.task === "string" ? params.task : null;
  return <FocusTimer {...data} initialTaskId={task} />;
}

function FocusSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-9 pt-2">
      <div className="h-[42px] w-80 max-w-full animate-pulse rounded-[11px] bg-chip" />
      <div className="aspect-square w-[min(340px,82vw)] rounded-full border-[10px] border-track" />
      <div className="h-9 w-44 animate-pulse rounded-full bg-chip" />
    </div>
  );
}
