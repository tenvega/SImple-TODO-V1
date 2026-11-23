import type { Metadata } from "next";
import { ViewPage } from "@/components/tasks/view-page";

export const metadata: Metadata = { title: "All" };

export default function AllPage({ searchParams }: PageProps<"/all">) {
  return <ViewPage view="all" title="All" searchParams={searchParams} />;
}
