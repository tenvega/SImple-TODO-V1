import type { Metadata } from "next";
import { ViewPage } from "@/components/tasks/view-page";

export const metadata: Metadata = { title: "All" };

export default function AllPage() {
  return <ViewPage view="all" title="All" />;
}
