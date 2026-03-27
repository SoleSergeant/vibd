import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recommendTasks } from "@/lib/ai";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { visibility: "PUBLIC", status: "OPEN" },
    include: { organization: true, taskSkills: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
    take: 12
  });

  const recommendations = await recommendTasks({
    volunteer: user.volunteerProfile,
    tasks
  });

  return NextResponse.json({ recommendations });
}
