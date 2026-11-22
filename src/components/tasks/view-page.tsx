import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getTaskView } from "@/lib/tasks/queries";
import type { TaskView } from "@/lib/tasks/types";
import { TaskBoard } from "./task-board";
import { TaskListSkeleton } from "./task-skeleton";

/** Shared page frame: a static title in the prerendered shell, the list streamed in. */
export function ViewPage({ view, title }: { view: TaskView; title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">{title}</h1>
      <Suspense fallback={<TaskListSkeleton quickAdd={view !== "completed"} />}>
        <TaskList view={view} />
      </Suspense>
    </div>
  );
}

async function TaskList({ view }: { view: TaskView }) {
  await requireUser();
  const data = await getTaskView(view);
  return <TaskBoard view={view} {...data} />;
}
