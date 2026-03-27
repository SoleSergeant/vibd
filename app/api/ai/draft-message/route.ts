import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { draftMessage } from "@/lib/ai";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.volunteerProfileId) {
    return NextResponse.json({ error: "volunteerProfileId is required" }, { status: 400 });
  }

  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { id: String(body.volunteerProfileId) },
    include: {
      skills: { include: { skill: true } },
      badges: { include: { badge: true } },
      portfolioItems: {
        include: {
          task: { include: { organization: true } },
          submission: { include: { rating: true } }
        },
        orderBy: { completedAt: "desc" },
        take: 3
      }
    }
  });
  if (!volunteer) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  const task = body.taskId
    ? await prisma.task.findFirst({
        where: { id: String(body.taskId), organizationId: user.organizationProfile.id },
        include: { taskSkills: { include: { skill: true } } }
      })
    : null;

  const draft = await draftMessage({
    volunteerName: volunteer.fullName,
    volunteerBio: volunteer.bio,
    volunteerSkills: volunteer.skills.map((item) => item.skill.name),
    volunteerHighlights: volunteer.portfolioItems.map((item) => `${item.task.title} at ${item.task.organization.name}`),
    organizationName: user.organizationProfile.name,
    taskTitle: task?.title ?? null,
    taskDescription: task?.description ?? null,
    taskSkills: task?.taskSkills.map((item) => item.skill.name) ?? [],
    extraContext: String(body.extraContext || "").trim(),
    goal: String(body.goal || "Invite the volunteer to continue the conversation."),
    tone: String(body.tone || "warm"),
    priorRelationship: String(body.priorRelationship || "")
  });

  return NextResponse.json({ draft });
}
