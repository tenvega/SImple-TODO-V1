import type { Metadata } from "next";
import { ViewPage } from "@/components/tasks/view-page";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return <ViewPage view="today" title="Today" />;
}
