import Link from "next/link";
import { Suspense, ViewTransition, type ReactNode } from "react";
import { SettingsIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { CommandMenu } from "@/components/shell/command-menu";
import { NewTaskButton } from "@/components/shell/new-task-button";
import { Sidebar } from "@/components/shell/sidebar";
import { TabBar } from "@/components/shell/tab-bar";
import { TimeZoneSync } from "@/components/shell/time-zone-sync";
import { getTimeZone, getViewCounts } from "@/lib/tasks/queries";

export default function AppLayout({ children }: { children: ReactNode }) {
  // Started once and shared by every count in the sidebar.
  const counts = getViewCounts();

  return (
    <div className="flex min-h-dvh">
      <Sidebar counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-line bg-side px-4 backdrop-blur-xl backdrop-saturate-150 md:hidden">
          <Link href="/today" className="flex items-center gap-2 font-semibold tracking-tight">
            <LogoMark size={22} />
            TaskFlow
          </Link>
          <Link href="/settings" aria-label="Settings" className="-mr-2 flex size-11 items-center justify-center">
            <SettingsIcon size={20} />
          </Link>
        </header>
        <ViewTransition>
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-36 sm:px-8 md:px-12 md:pt-10 md:pb-16">
            {children}
          </main>
        </ViewTransition>
      </div>
      <TabBar />
      <NewTaskButton />
      <CommandMenu />
      <Suspense fallback={null}>
        <TimeZoneSyncLoader />
      </Suspense>
    </div>
  );
}

async function TimeZoneSyncLoader() {
  return <TimeZoneSync serverTimeZone={await getTimeZone()} />;
}
