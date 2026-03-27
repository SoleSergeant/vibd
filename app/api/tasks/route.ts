import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue, parseBooleanString, parseDateOrDefault, splitCsv } from "@/lib/forms";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
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

  const task = await prisma.task.create({
    data: {
      organizationId: user.organizationProfile.id,
      title,
      description,
      category,
      difficulty: difficulty as never,
      deadline,
      rewardType: rewardType as never,
      stipendAmount,
      visibility: visibility as never,
      location,
      isRemote,
      taskSkills: skillRecords.length
        ? {
            create: skillRecords.map((skill) => ({
              skillId: skill.id
            }))
          }
        : undefined
    }
  });

  return NextResponse.redirect(new URL(`/tasks/${task.id}`, request.url), 303);
}
