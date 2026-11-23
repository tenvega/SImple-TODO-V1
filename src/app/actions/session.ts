"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { TIME_ZONE_COOKIE } from "@/lib/tasks/queries";

/**
 * Remembers the browser's time zone so server-rendered lists agree with the
 * visitor's "today". Not sensitive; validated so it can't carry anything else.
 */
export async function rememberTimeZone(timeZone: unknown): Promise<void> {
  if (!isValidTimeZone(timeZone)) return;
  (await cookies()).set(TIME_ZONE_COOKIE, timeZone, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

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

  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  await rememberTimeZone(zone);

  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_sandbox", { p_time_zone: zone });

  return { ok: !error };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
