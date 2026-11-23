import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo";
import { requireUser } from "@/lib/auth";
import type { ViewCounts } from "@/lib/tasks/queries";
import { TASK_NAV, TOOL_NAV, type NavItem } from "./nav";
import { SidebarLink } from "./nav-link";
import { SearchButton } from "./search-button";

/** Desktop sidebar. The links are static; counts and the account card stream in. */
export function Sidebar({ counts }: { counts: Promise<ViewCounts> }) {
  return (
    <nav
      aria-label="Sections"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-line bg-side px-3 py-4 backdrop-blur-xl backdrop-saturate-150 md:flex"
    >
      <Link href="/today" className="flex items-center gap-2.5 px-2 pt-2 pb-4">
        <LogoMark />
        <span className="font-semibold tracking-tight">TaskFlow</span>
      </Link>
      <SearchButton />
      {TASK_NAV.map((item) => (
        <SidebarLink key={item.href} href={item.href} label={item.label} icon={<item.icon />}>
          <NavCount item={item} counts={counts} />
        </SidebarLink>
      ))}
      <div className="mx-2.5 my-3 h-px bg-line" />
      {TOOL_NAV.map((item) => (
        <SidebarLink key={item.href} href={item.href} label={item.label} shortcut={item.shortcut} icon={<item.icon />} />
      ))}
      <div className="flex-1" />
      <Suspense fallback={<div className="mx-1 h-[72px] rounded-xl border border-line" />}>
        <AccountCard />
      </Suspense>
    </nav>
  );
}

function NavCount({ item, counts }: { item: NavItem; counts: Promise<ViewCounts> }) {
  if (!item.countKey) return null;
  return (
    <Suspense fallback={null}>
      <CountValue counts={counts} countKey={item.countKey} />
    </Suspense>
  );
}

async function CountValue({
  counts,
  countKey,
}: {
  counts: Promise<ViewCounts>;
  countKey: NonNullable<NavItem["countKey"]>;
}) {
  const value = (await counts)[countKey];
  return value > 0 ? <span className="text-[13px] font-medium text-muted tabular-nums">{value}</span> : null;
}

async function AccountCard() {
  const user = await requireUser();
  if (user.isAnonymous) {
    return (
      <div className="mx-1 mb-1 flex flex-col gap-1.5 rounded-xl border border-line p-3 text-[13px]">
        <span className="font-semibold">Demo sandbox</span>
        <span className="leading-snug text-muted">Only you can see this data. It clears after 7 days.</span>
        <Link href="/settings" className="font-medium underline underline-offset-[3px]">
          Keep it with email
        </Link>
      </div>
    );
  }
  const email = user.email ?? "Account";
  return (
    <Link href="/settings" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-chip">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-full border border-line bg-chip text-xs font-semibold uppercase"
      >
        {email[0]}
      </span>
      <span className="truncate text-sm">{email}</span>
    </Link>
  );
}
