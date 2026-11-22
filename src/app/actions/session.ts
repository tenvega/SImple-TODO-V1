"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const timeZoneSchema = z
  .string()
  .max(64)
  .regex(/^[A-Za-z]+(?:[/_+-][A-Za-z0-9]+)*$/)
  .catch("UTC");

/**
 * Fills a brand-new demo sandbox with sample tasks and focus history.
 * The database function only writes rows for the caller and is a no-op
 * when the account already has tasks.
 */
export async function seedSandbox(timeZone: unknown): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (!user.isAnonymous) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_sandbox", {
    p_time_zone: timeZoneSchema.parse(timeZone),
  });

  return { ok: !error };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
