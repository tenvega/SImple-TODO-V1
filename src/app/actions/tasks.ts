"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { taskInputSchema } from "@/lib/tasks/types";

/**
 * Task mutations. Each one is a public POST endpoint, so each one checks the
 * session and validates its input. Ownership is never taken from the client:
 * Row Level Security scopes every statement to the signed-in user.
 */

/**
 * Re-renders the app shell as well as the page, so sidebar counts update in
 * the same response as the list. Nothing here is cached; this only tells the
 * router what to re-render.
 */
function rerender() {
  revalidatePath("/(app)", "layout");
}

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const idSchema = z.uuid();

function failure(error: { code?: string; hint?: string } | null, fallback: string): ActionResult {
  if (error?.hint === "quota_exceeded") {
    return { ok: false, error: "This sandbox is full (300 tasks or 50 tags). Delete some to add more." };
  }
  if (error?.code === "P0002") {
    return { ok: false, error: "That task no longer exists." };
  }
  return { ok: false, error: fallback };
}

export async function saveTask(input: unknown): Promise<ActionResult> {
  await requireUser();
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the task details." };
  }

  const t = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_task", {
    p_id: t.id,
    p_title: t.title,
    p_notes: t.notes ?? undefined,
    p_due_at: t.dueAt ?? undefined,
    p_due_has_time: t.dueHasTime,
    p_priority: t.priority,
    p_tags: t.tags,
  });
  if (error) return failure(error, "Couldn't save the task.");

  rerender();
  return { ok: true, id: data };
}

export async function setTaskCompleted(id: unknown, completed: unknown): Promise<ActionResult> {
  await requireUser();
  const taskId = idSchema.safeParse(id);
  const done = z.boolean().safeParse(completed);
  if (!taskId.success || !done.success) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed_at: done.data ? new Date().toISOString() : null })
    .eq("id", taskId.data)
    .select("id");
  if (error) return failure(error, "Couldn't update the task.");
  if (data.length === 0) return failure({ code: "P0002" }, "");

  rerender();
  return { ok: true };
}

export async function deleteTask(id: unknown): Promise<ActionResult> {
  await requireUser();
  const taskId = idSchema.safeParse(id);
  if (!taskId.success) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").delete().eq("id", taskId.data).select("id");
  if (error) return failure(error, "Couldn't delete the task.");
  if (data.length === 0) return failure({ code: "P0002" }, "");

  rerender();
  return { ok: true };
}
