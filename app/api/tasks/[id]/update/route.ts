import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue, parseBooleanString, parseDateOrDefault, splitCsv } from "@/lib/forms";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task || task.organizationId !== user.organizationProfile.id) {
    return NextResponse.redirect(new URL("/organization/dashboard", request.url), 303);
  }

  const form = await request.formData();
  const title = formValue(form.get("title"));
  const description = formValue(form.get("description"));
  const category = formValue(form.get("category"));
  const requiredSkills = splitCsv(formValue(form.get("requiredSkills")));
  const difficulty = formValue(form.get("difficulty")) || "MEDIUM";
  const rewardType = formValue(form.get("rewardType")) || "EXPERIENCE";
  const deadline = parseDateOrDefault(formValue(form.get("deadline")));
  const stipendAmount = Number(formValue(form.get("stipendAmount")) || "0") || null;
  const visibility = formValue(form.get("visibility")) === "PRIVATE" ? "PRIVATE" : "PUBLIC";
  const location = formValue(form.get("location")) || null;
  const isRemote = parseBooleanString(formValue(form.get("isRemote")) || "true");

  const skillRecords = await Promise.all(
    requiredSkills.length
      ? requiredSkills.map((skillName) =>
          prisma.skill.upsert({
            where: { name: skillName },
            update: { category },
            create: {
              name: skillName,
              slug: skillName.toLowerCase().replace(/\s+/g, "-"),
              category
            }
          })
        )
      : []
  );

  await prisma.task.update({
    where: { id: params.id },
    data: {
      title,
      description,
      category,
      difficulty: difficulty as never,
      rewardType: rewardType as never,
      deadline,
      stipendAmount,
      visibility: visibility as never,
      location,
      isRemote,
      taskSkills: {
        deleteMany: {},
        create: skillRecords.map((skill) => ({
          skillId: skill.id
        }))
      }
    }
  });

  return NextResponse.redirect(new URL(`/tasks/${params.id}`, request.url), 303);
}
