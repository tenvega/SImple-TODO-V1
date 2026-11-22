import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { z } from "zod";
import { getTask, getTaskView } from "@/lib/tasks/queries";
import type { TaskView } from "@/lib/tasks/types";
import { TaskBoard } from "./task-board";
import { TaskListSkeleton } from "./task-skeleton";

/** Shared page frame: a static title in the prerendered shell, the list streamed in. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function ViewPage({ view, title, searchParams }: { view: TaskView; title: string; searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">{title}</h1>
      <Suspense fallback={<TaskListSkeleton quickAdd={view !== "completed"} />}>
        <TaskList view={view} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TaskList({ view, searchParams }: { view: TaskView; searchParams: SearchParams }) {
  await requireUser();
  const [data, params] = await Promise.all([getTaskView(view), searchParams]);
  // A linked task outside this list (e.g. an old completion found by search).
  const taskId = z.uuid().safeParse(params.task);
  const linked =
    taskId.success && !data.tasks.some((t) => t.id === taskId.data) ? await getTask(taskId.data) : null;
  return <TaskBoard view={view} {...data} linked={linked} />;
}
