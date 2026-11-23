import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DayChart } from "@/components/insights/day-chart";
import { requireUser } from "@/lib/auth";
import { getInsights } from "@/lib/insights/queries";
import { formatDuration, type Range } from "@/lib/insights/stats";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage({ searchParams }: PageProps<"/insights">) {
  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">Insights</h1>
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function InsightsLoader({ searchParams }: { searchParams: PageProps<"/insights">["searchParams"] }) {
  await requireUser();
  const range: Range = (await searchParams).range === "month" ? "month" : "week";
  const { insights: s, timeZone } = await getInsights(range);

  const first = new Date(s.days[0].date);
  const last = new Date(s.days.at(-1)!.date);
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" });
  const diff = s.tasksDone - s.tasksBefore;
  const before = range === "week" ? "last week" : "prior 30d";
  const rate = s.dueCount > 0 ? Math.round((s.dueDone / s.dueCount) * 100) : null;

  return (
    <>
      <div className="-mt-4 flex flex-wrap items-center justify-between gap-4">
        <span className="text-[13px] font-medium text-muted">{fmt.formatRange(first, last)}</span>
        <nav aria-label="Period" className="flex rounded-[11px] bg-chip p-[3px]">
          {(["week", "month"] as const).map((r) => (
            <Link
              key={r}
              href={r === "week" ? "/insights" : "/insights?range=month"}
              aria-current={r === range ? "page" : undefined}
              replace
              scroll={false}
              className={`flex h-8 items-center rounded-lg px-4 text-sm ${
                r === range ? "bg-seg font-semibold text-fg shadow-sm" : "text-muted"
              }`}
            >
              {r === "week" ? "Week" : "Month"}
            </Link>
          ))}
        </nav>
      </div>

      <p className="max-w-[640px] text-[19px] leading-snug font-medium tracking-tight">{s.summary}</p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card
          label="Tasks done"
          value={String(s.tasksDone)}
          detail={diff === 0 ? `Same as ${before}` : `${diff > 0 ? "+" : "−"}${Math.abs(diff)} vs ${before}`}
        />
        <Card
          label="Focus time"
          value={formatDuration(s.focusSeconds)}
          detail={`${s.focusSessions} session${s.focusSessions === 1 ? "" : "s"}`}
        />
        <Card
          label="Streak"
          value={`${s.streak} day${s.streak === 1 ? "" : "s"}`}
          detail={`Best: ${s.bestStreak} day${s.bestStreak === 1 ? "" : "s"}`}
        />
        <Card
          label="Completion rate"
          value={rate === null ? "—" : `${rate}%`}
          detail={rate === null ? "Nothing was due" : `${s.dueDone} of ${s.dueCount} due`}
        />
      </div>

      <section aria-labelledby="chart-h" className="flex flex-col gap-5 rounded-2xl border border-line p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="chart-h" className="font-semibold">
            Tasks completed
          </h2>
          <span className="text-[13px] text-muted">Tap a day for details</span>
        </div>
        <DayChart key={range} days={s.days} range={range} timeZone={timeZone} />
      </section>
    </>
  );
}

function Card({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-line p-4">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="text-[26px] leading-tight font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-[30px]">{value}</span>
      <span className="text-[13px] text-muted">{detail}</span>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div aria-hidden="true" className="-mt-4 flex flex-col gap-7">
      <div className="h-4 w-28 animate-pulse rounded bg-chip" />
      <div className="h-14 max-w-[640px] animate-pulse rounded-lg bg-chip" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[118px] animate-pulse rounded-2xl border border-line bg-chip/40" />
        ))}
      </div>
      <div className="h-[330px] animate-pulse rounded-2xl border border-line bg-chip/40" />
    </div>
  );
}
