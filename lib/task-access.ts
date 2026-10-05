import type { Task } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Public tasks are visible to every volunteer; private tasks only to volunteers invited to them. */
export async function volunteerCanViewTask(volunteerProfileId: string, task: Pick<Task, "id" | "visibility" | "organizationId">) {
  if (task.visibility === "PUBLIC") return true;
  const thread = await prisma.messageThread.findUnique({
    where: {
      volunteerProfileId_organizationProfileId: {
        volunteerProfileId,
        organizationProfileId: task.organizationId
      }
    },
    select: { taskId: true, status: true }
  });
  return Boolean(thread && thread.taskId === task.id && thread.status !== "DECLINED");
}

export function taskAcceptsWork(task: Pick<Task, "status">) {
  return task.status === "OPEN" || task.status === "IN_REVIEW";
}
