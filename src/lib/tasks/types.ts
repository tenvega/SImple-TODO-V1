import { z } from "zod";

export const PRIORITIES = ["none", "low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TAG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,31}$/;
export const MAX_TAGS = 10;

/** A task as the UI sees it. Never includes user_id. */
export type Task = {
  id: string;
  title: string;
  notes: string | null;
  dueAt: string | null;
  dueHasTime: boolean;
  priority: Priority;
  completedAt: string | null;
  tags: string[];
  focusCount: number;
  focusSeconds: number;
};

export type TaskView = "today" | "upcoming" | "all" | "completed";

/** What a client may send to create or edit a task. Ownership is never part of it. */
export const taskInputSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Give the task a title.").max(200),
  notes: z.string().max(5000).nullable().default(null),
  dueAt: z.iso.datetime({ offset: true }).nullable().default(null),
  dueHasTime: z.boolean().default(true),
  priority: z.enum(PRIORITIES).default("none"),
  tags: z
    .array(z.string().trim().toLowerCase().regex(TAG_PATTERN, "Tags use letters, numbers, - and _."))
    .max(MAX_TAGS)
    .default([])
    .transform((tags) => [...new Set(tags)]),
});

export type TaskInput = z.input<typeof taskInputSchema>;
