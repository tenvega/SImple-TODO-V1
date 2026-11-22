"use client";

import { MotionConfig, motion } from "motion/react";
import { useState } from "react";
import { formatDuration, type DayStat, type Range } from "@/lib/insights/stats";

type Props = { days: DayStat[]; range: Range; timeZone: string };

const PLOT = 200;
/** Gap plus day label under each bar. */
const LABEL_ROW = 28;

function barHeight(tasks: number, max: number) {
  return tasks === 0 ? 3 : Math.max(8, (tasks / max) * PLOT);
}

/** A round, even ceiling so the midline is a whole number. */
function scaleMax(max: number) {
  return Math.max(2, Math.ceil(max / 2) * 2);
}

/** Tasks completed per day, Health-style. Tap or arrow-key through days for details. */
export function DayChart({ days, range, timeZone }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = scaleMax(Math.max(...days.map((d) => d.tasks)));
  const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone, ...options });
  const spoken = fmt({ weekday: "long", month: "long", day: "numeric" });
  const short = fmt({ weekday: "short", month: "short", day: "numeric" });
  const initial = fmt({ weekday: "narrow" });
  const dayOfMonth = fmt({ day: "numeric" });

  function label(d: DayStat, i: number) {
    if (d.isToday) return "Today";
    if (range === "week") return initial.format(new Date(d.date));
    // Month: a date every week, counted back from today so labels never crowd it.
    return (days.length - 1 - i) % 7 === 0 ? dayOfMonth.format(new Date(d.date)) : "";
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null || next < 0 || next >= days.length) return;
    e.preventDefault();
    setSelected(next);
    (e.currentTarget.parentElement?.parentElement?.children[next]?.querySelector("button") as HTMLElement | null)?.focus();
  }

  const active = selected !== null ? days[selected] : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative h-60">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-7 flex flex-col justify-between" style={{ height: PLOT }}>
          {[max, max / 2, 0].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="h-px flex-1 bg-line" />
              <span className="w-5 text-right text-xs text-muted tabular-nums">{v}</span>
            </div>
          ))}
        </div>

        <div className={`absolute inset-x-0 bottom-0 flex pr-7 ${range === "week" ? "gap-3" : "gap-[3px]"}`}>
          {days.map((d, i) => {
            const isSelected = selected === i;
            const height = barHeight(d.tasks, max);
            const date = new Date(d.date);
            return (
              <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                <button
                  type="button"
                  aria-label={`${spoken.format(date)}${d.isToday ? " (today)" : ""}: ${d.tasks} task${d.tasks === 1 ? "" : "s"}, ${formatDuration(d.focusSeconds)} focus`}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(isSelected ? null : i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className="flex w-full items-end justify-center"
                  style={{ height: PLOT }}
                >
                  <motion.span
                    initial={{ height: 3 }}
                    animate={{ height }}
                    transition={{ type: "spring", stiffness: 260, damping: 30, delay: i * (range === "week" ? 0.03 : 0.008) }}
                    className={`w-full max-w-12 ${d.tasks === 0 ? "rounded-sm" : range === "week" ? "rounded-t-lg rounded-b-[3px]" : "rounded-t-[3px] rounded-b-[1px]"} ${
                      isSelected ? "bg-fg" : "bg-bar"
                    }`}
                  />
                </button>
                <span className={`h-4 text-xs whitespace-nowrap ${isSelected ? "font-semibold text-fg" : "text-muted"}`}>
                  {label(d, i)}
                </span>
              </div>
            );
          })}
        </div>

        {active && selected !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute flex w-44 flex-col gap-1 rounded-xl bg-inv px-3.5 py-3 text-[13px] text-inv-fg shadow-sheet"
            style={{
              // Just above the bar: label row (28px) + bar height + a gap.
              bottom: LABEL_ROW + barHeight(active.tasks, max) + 8,
              // Centered over the bar, kept inside the chart at the edges.
              left: `clamp(0px, calc(${((selected + 0.5) / days.length) * 100}% - 88px - ${((selected + 0.5) / days.length) * 28}px), calc(100% - 176px))`,
            }}
          >
            <span className="font-semibold">{active.isToday ? "Today" : short.format(new Date(active.date))}</span>
            <span>
              {active.tasks} task{active.tasks === 1 ? "" : "s"} · {formatDuration(active.focusSeconds)} focus
            </span>
          </div>
        ) : null}
      </div>
    </MotionConfig>
  );
}
