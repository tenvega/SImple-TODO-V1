import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

export type Client = SupabaseClient<Database>;

export function newClient(): Client {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** A fresh, isolated user (anonymous, like a demo visitor). */
export async function newUser(): Promise<{ db: Client; id: string }> {
  const db = newClient();
  const { data, error } = await db.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`Anonymous sign-in failed: ${error?.message}`);
  }
  return { db, id: data.user.id };
}
