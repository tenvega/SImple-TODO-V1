import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "@/env";
import type { Database } from "./database.types";

/**
 * Server client for Server Components, Server Actions and Route Handlers.
 * It acts as the signed-in user: every query carries their session JWT, so
 * Postgres Row Level Security decides what they can see. Create one per
 * request; never share it across requests.
 */
export async function createClient() {
  // Session checks compare token expiry with the current time, so they must
  // run at request time, never during prerendering.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies. The proxy refreshes the
            // session on every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}
