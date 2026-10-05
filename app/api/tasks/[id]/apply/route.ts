import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";
import { taskAcceptsWork, volunteerCanViewTask } from "@/lib/task-access";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    select: { id: true, visibility: true, organizationId: true, status: true }
  });
  if (!task || !(await volunteerCanViewTask(user.volunteerProfile.id, task))) {
    return NextResponse.redirect(new URL("/marketplace", request.url), 303);
  }
  if (!taskAcceptsWork(task)) {
    return NextResponse.redirect(new URL(`/tasks/${task.id}?error=closed`, request.url), 303);
  }

  const note = formValue((await request.formData()).get("note"), 2000);

  await prisma.taskApplication.upsert({
    where: {
      taskId_volunteerProfileId: {
        taskId: task.id,
        volunteerProfileId: user.volunteerProfile.id
      }
    },
    update: { note, status: "APPLIED" },
    create: {
      taskId: task.id,
      volunteerProfileId: user.volunteerProfile.id,
      note,
      status: "APPLIED"
    }
  });

  return NextResponse.redirect(new URL(`/tasks/${task.id}`, request.url), 303);
}
