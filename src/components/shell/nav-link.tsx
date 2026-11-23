"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { NavItem } from "./nav";

type Props = Pick<NavItem, "href" | "label" | "shortcut"> & { icon: ReactNode; children?: ReactNode };

/** Icons arrive rendered: a Server Component can't hand a component function to the client. */
export function SidebarLink({ href, label, shortcut, icon, children }: Props) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 transition-colors hover:bg-chip ${
        active ? "bg-chip font-semibold" : ""
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {children}
      {shortcut ? <kbd className="font-sans text-xs text-muted">{shortcut}</kbd> : null}
    </Link>
  );
}
