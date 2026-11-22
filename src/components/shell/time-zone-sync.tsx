"use client";

import { startTransition, useEffect } from "react";
import { rememberTimeZone } from "@/app/actions/session";

/**
 * Tells the server the browser's time zone when it differs from the one the
 * page was rendered with. Setting the cookie re-renders the current page.
 */
export function TimeZoneSync({ serverTimeZone }: { serverTimeZone: string }) {
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && zone !== serverTimeZone) {
      startTransition(() => rememberTimeZone(zone));
    }
  }, [serverTimeZone]);
  return null;
}
