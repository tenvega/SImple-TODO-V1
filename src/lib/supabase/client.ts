"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/env";
import type { Database } from "./database.types";

/**
 * Browser client. Auth calls (anonymous sign-in, magic link) run from the
 * browser so Supabase Auth's per-IP rate limits see the visitor's real IP
 * instead of the server's.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
