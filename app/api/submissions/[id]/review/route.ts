import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";
import { refreshVolunteerRankings } from "@/lib/ranking";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { task: { include: { organization: true } }, volunteerProfile: true }
  });
  if (!submission || submission.task.organizationId !== user.organizationProfile.id) {
    return NextResponse.redirect(new URL("/organization/submissions", request.url), 303);
  }

  const form = await request.formData();
  const status = formValue(form.get("status")) || "SUBMITTED";
  const quality = Number(formValue(form.get("quality")) || "0") || 0;
  const communication = Number(formValue(form.get("communication")) || "0") || 0;
  const speed = Number(formValue(form.get("speed")) || "0") || 0;
  const feedback = formValue(form.get("feedback"));

  await prisma.submission.update({
    where: { id: params.id },
    data: {
      status: status as never,
      reviewedAt: new Date(),
      reviewedByOrganizationId: user.organizationProfile.id,
      reviewerNote: feedback
    }
  });

  if (quality || communication || speed || feedback) {
    await prisma.rating.upsert({
      where: { submissionId: params.id },
      update: {
        quality,
        communication,
        speed,
        feedback
      },
      create: {
        submissionId: params.id,
        quality,
        communication,
        speed,
        feedback
      }
    });
  }

  if (status === "ACCEPTED") {
    const existingPortfolioItem = await prisma.portfolioItem.findUnique({
      where: { submissionId: params.id }
    });
    const rating = await prisma.rating.findUnique({ where: { submissionId: params.id } });
    await prisma.portfolioItem.upsert({
      where: { submissionId: params.id },
      update: {
        summary: submission.textSummary,
        feedback,
        rating: rating ? Math.round((rating.quality + rating.communication + rating.speed) / 3) : 0,
        completedAt: new Date(),
        taskTitle: submission.task.title,
        organizationName: submission.task.organization.name
      },
      create: {
        volunteerProfileId: submission.volunteerProfileId,
        taskId: submission.taskId,
        submissionId: params.id,
        taskTitle: submission.task.title,
        organizationName: submission.task.organization.name,
        summary: submission.textSummary,
        feedback,
        rating: rating ? Math.round((rating.quality + rating.communication + rating.speed) / 3) : 0,
        completedAt: new Date()
      }
    });
    if (!existingPortfolioItem) {
      await prisma.taskApplication.updateMany({
        where: { taskId: submission.taskId, volunteerProfileId: submission.volunteerProfileId },
        data: { status: "SHORTLISTED" }
      });
    }
    await prisma.task.update({
      where: { id: submission.taskId },
      data: { status: "COMPLETED" }
    });
    await refreshVolunteerRankings(prisma);
  } else if (status === "REJECTED") {
    await prisma.taskApplication.updateMany({
      where: { taskId: submission.taskId, volunteerProfileId: submission.volunteerProfileId },
      data: { status: "REJECTED" }
    });
  }

  return NextResponse.redirect(new URL("/organization/submissions", request.url), 303);
}
