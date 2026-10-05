import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { upsertSkills } from "@/lib/skills";
import { parseTaskForm } from "@/lib/task-form";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const task = await prisma.task.findUnique({ where: { id: params.id }, select: { organizationId: true } });
  if (!task || task.organizationId !== user.organizationProfile.id) {
    return NextResponse.redirect(new URL("/organization/dashboard", request.url), 303);
  }

  const input = parseTaskForm(await request.formData());
  if (!input) {
    return NextResponse.redirect(new URL(`/organization/tasks/${params.id}/edit?error=missing`, request.url), 303);
  }

  const { requiredSkills, ...data } = input;
  await prisma.$transaction(async (tx) => {
    const skills = await upsertSkills(tx, requiredSkills, data.category);
    await tx.task.update({
      where: { id: params.id },
      data: {
        ...data,
        taskSkills: {
          deleteMany: {},
          create: skills.map((skill) => ({ skillId: skill.id }))
        }
      }
    });
  });

  return NextResponse.redirect(new URL(`/tasks/${params.id}`, request.url), 303);
}
