import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { upsertSkills } from "@/lib/skills";
import { parseTaskForm } from "@/lib/task-form";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const input = parseTaskForm(await request.formData());
  if (!input) {
    return NextResponse.redirect(new URL("/organization/tasks/new?error=missing", request.url), 303);
  }

  const { requiredSkills, ...data } = input;
  const organizationId = user.organizationProfile.id;
  const task = await prisma.$transaction(async (tx) => {
    const skills = await upsertSkills(tx, requiredSkills, data.category);
    return tx.task.create({
      data: {
        ...data,
        organizationId,
        taskSkills: skills.length ? { create: skills.map((skill) => ({ skillId: skill.id })) } : undefined
      }
    });
  });

  return NextResponse.redirect(new URL(`/tasks/${task.id}`, request.url), 303);
}
