import type { Metadata } from "next";
import { ViewPage } from "@/components/tasks/view-page";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage({ searchParams }: PageProps<"/today">) {
  return <ViewPage view="today" title="Today" searchParams={searchParams} />;
}
