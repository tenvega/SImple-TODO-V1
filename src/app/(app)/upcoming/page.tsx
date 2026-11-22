import type { Metadata } from "next";
import { ViewPage } from "@/components/tasks/view-page";

export const metadata: Metadata = { title: "Upcoming" };

export default function UpcomingPage() {
  return <ViewPage view="upcoming" title="Upcoming" />;
}
