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
    where: { id: String(body.volunteerProfileId) }
  });
  if (!volunteer) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  const task = body.taskId
    ? await prisma.task.findFirst({
        where: { id: String(body.taskId), organizationId: user.organizationProfile.id }
      })
    : null;

  const draft = await draftMessage({
    volunteerName: volunteer.fullName,
    volunteerBio: volunteer.bio,
    organizationName: user.organizationProfile.name,
    taskTitle: task?.title ?? null,
    taskDescription: task?.description ?? null,
    goal: String(body.goal || "Invite the volunteer to continue the conversation."),
    tone: String(body.tone || "warm"),
    priorRelationship: String(body.priorRelationship || "")
  });

  return NextResponse.json({ draft });
}
