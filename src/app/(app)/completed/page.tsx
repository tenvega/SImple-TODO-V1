import type { Metadata } from "next";
import { ViewPage } from "@/components/tasks/view-page";

export const metadata: Metadata = { title: "Completed" };

export default function CompletedPage({ searchParams }: PageProps<"/completed">) {
  return <ViewPage view="completed" title="Completed" searchParams={searchParams} />;
}
