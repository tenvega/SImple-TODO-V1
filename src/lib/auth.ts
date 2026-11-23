import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  isAnonymous: boolean;
};

/**
 * Data Access Layer entry point. The only way server code learns who is
 * calling: from the verified session JWT, never from a client-supplied ID.
 * Redirects to the landing page when there is no valid session.
 */
export async function requireUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/");
  }

  return {
    id: claims.sub,
    isAnonymous: claims.is_anonymous === true,
  };
}
