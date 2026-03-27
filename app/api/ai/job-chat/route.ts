import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { answerJobQuestion } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const taskId = String(body?.taskId || "");
  const question = String(body?.question || "").trim();

  if (!taskId || !question) {
    return NextResponse.json({ error: "taskId and question are required" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      organization: true,
      taskSkills: { include: { skill: true } }
    }
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.visibility === "PRIVATE") {
    const thread = await prisma.messageThread.findUnique({
      where: {
        volunteerProfileId_organizationProfileId: {
          volunteerProfileId: user.volunteerProfile.id,
          organizationProfileId: task.organizationId
        }
      }
    });
    if (!thread || thread.taskId !== task.id) {
      return NextResponse.json({ error: "This private task is only visible to invited volunteers." }, { status: 403 });
    }
  }

  const answer = await answerJobQuestion({
    question,
    messages: Array.isArray(body?.messages)
      ? body.messages
          .filter((message: { role?: string; content?: string }) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
          .map((message: { role: "user" | "assistant"; content: string }) => ({
            role: message.role,
            content: message.content
          }))
      : [],
    task: {
      title: task.title,
      description: task.description,
      category: task.category,
      difficulty: task.difficulty,
      rewardType: task.rewardType,
      visibility: task.visibility,
      stipendAmount: task.stipendAmount,
      organizationName: task.organization.name,
      organizationDescription: task.organization.description,
      organizationWebsite: task.organization.website,
      skills: task.taskSkills.map((item) => item.skill.name)
    },
    volunteer: {
      fullName: user.volunteerProfile.fullName,
      bio: user.volunteerProfile.bio,
      skills: user.volunteerProfile.skills.map((item) => item.skill.name),
      interests: user.volunteerProfile.interests,
      availability: user.volunteerProfile.availability,
      opportunityStatus: user.volunteerProfile.opportunityStatus,
      impactScore: user.volunteerProfile.impactScore,
      ranking: user.volunteerProfile.ranking,
      verified: user.volunteerProfile.verified
    }
  });

  return NextResponse.json(answer);
}
