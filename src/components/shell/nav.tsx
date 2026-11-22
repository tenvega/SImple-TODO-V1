import type { ComponentType } from "react";
import { CalendarIcon, DoneIcon, FocusIcon, InsightsIcon, ListIcon, TodayIcon } from "@/components/icons";

export type NavItem = {
  href: "/today" | "/upcoming" | "/all" | "/completed" | "/focus" | "/insights";
  label: string;
  icon: ComponentType<{ size?: number }>;
  countKey?: "today" | "upcoming" | "all";
  shortcut?: string;
};

export const TASK_NAV: NavItem[] = [
  { href: "/today", label: "Today", icon: TodayIcon, countKey: "today" },
  { href: "/upcoming", label: "Upcoming", icon: CalendarIcon, countKey: "upcoming" },
  { href: "/all", label: "All", icon: ListIcon, countKey: "all" },
  { href: "/completed", label: "Completed", icon: DoneIcon },
];

export const TOOL_NAV: NavItem[] = [
  { href: "/focus", label: "Focus", icon: FocusIcon, shortcut: "F" },
  { href: "/insights", label: "Insights", icon: InsightsIcon },
];

/** Window events that let distant components talk without shared state. */
export const OPEN_PALETTE_EVENT = "taskflow:open-palette";
export const NEW_TASK_EVENT = "taskflow:new-task";
