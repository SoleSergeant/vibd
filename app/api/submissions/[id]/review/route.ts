import { NextResponse } from "next/server";
import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue, parseEnum, parseIntInRange } from "@/lib/forms";
import { refreshVolunteerRankings } from "@/lib/ranking";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }
  const organizationId = user.organizationProfile.id;

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { task: { include: { organization: { select: { name: true } } } }, rating: true }
  });
  if (!submission || submission.task.organizationId !== organizationId) {
    return NextResponse.redirect(new URL("/organization/submissions", request.url), 303);
  }

  const form = await request.formData();
  // Accepting is final: the work is already on the volunteer's portfolio and counted in rankings.
  const status =
    submission.status === "ACCEPTED"
      ? SubmissionStatus.ACCEPTED
      : parseEnum(SubmissionStatus, formValue(form.get("status")), submission.status);
  const quality = parseIntInRange(formValue(form.get("quality")), 1, 5);
  const communication = parseIntInRange(formValue(form.get("communication")), 1, 5);
  const speed = parseIntInRange(formValue(form.get("speed")), 1, 5);
  const feedback = formValue(form.get("feedback"), 4000);

  const hasRatingInput = quality !== null || communication !== null || speed !== null || Boolean(feedback);
  const rating = hasRatingInput
    ? {
        // Unfilled scores fall back to the previous rating, or a neutral 3.
        quality: quality ?? submission.rating?.quality ?? 3,
        communication: communication ?? submission.rating?.communication ?? 3,
        speed: speed ?? submission.rating?.speed ?? 3,
        feedback: feedback || submission.rating?.feedback || ""
      }
    : submission.rating;

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedByOrganizationId: organizationId,
        reviewerNote: feedback || submission.reviewerNote
      }
    });

    if (hasRatingInput && rating) {
      await tx.rating.upsert({
        where: { submissionId: submission.id },
        update: rating,
        create: { submissionId: submission.id, ...rating }
      });
    }

    const applicationKey = { taskId: submission.taskId, volunteerProfileId: submission.volunteerProfileId };

    if (status === "ACCEPTED") {
      const portfolio = {
        taskTitle: submission.task.title,
        organizationName: submission.task.organization.name,
        summary: submission.textSummary,
        feedback: rating?.feedback ?? "",
        rating: rating ? Math.round((rating.quality + rating.communication + rating.speed) / 3) : 0
      };
      await tx.portfolioItem.upsert({
        where: { submissionId: submission.id },
        update: portfolio,
        create: {
          ...portfolio,
          volunteerProfileId: submission.volunteerProfileId,
          taskId: submission.taskId,
          submissionId: submission.id,
          completedAt: new Date()
        }
      });
      await tx.taskApplication.updateMany({ where: applicationKey, data: { status: "SHORTLISTED" } });
      await tx.task.updateMany({
        where: { id: submission.taskId, status: { in: ["OPEN", "IN_REVIEW"] } },
        data: { status: "COMPLETED" }
      });
    } else if (status === "REJECTED") {
      await tx.taskApplication.updateMany({ where: applicationKey, data: { status: "REJECTED" } });
    }
  });

  if (status === "ACCEPTED") {
    await refreshVolunteerRankings(prisma);
  }

  return NextResponse.redirect(new URL("/organization/submissions", request.url), 303);
}
