import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

const APP_ROUTES = ["/today", "/upcoming", "/all", "/completed", "/focus", "/insights", "/settings"];

/**
 * Runs before every matched request:
 * 1. Refreshes the Supabase session cookie so Server Components see a valid token.
 * 2. Optimistically redirects signed-out visitors away from app routes.
 *
 * This is a convenience, not the security boundary. Every data read and
 * write is still authorized by the session in the Data Access Layer and by
 * Row Level Security in Postgres.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // getClaims() verifies the JWT (and refreshes it when expired). Don't run
  // code between creating the client and this call.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname } = request.nextUrl;
  const isAppRoute = APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!signedIn && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Only page loads. A Server Action posted from the landing page right after
  // sign-in (seeding the demo) must reach its handler, not a redirect.
  if (signedIn && request.method === "GET" && (pathname === "/" || pathname === "/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sounds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg)$).*)"],
};
