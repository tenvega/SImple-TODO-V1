"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TASK_NAV, TOOL_NAV } from "./nav";

const TABS = [...TASK_NAV.filter((i) => i.href !== "/completed"), ...TOOL_NAV];

/** Mobile bottom tab bar, frosted like iOS. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-side pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? "font-semibold text-fg" : "text-muted"
                }`}
              >
                <Icon size={22} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
