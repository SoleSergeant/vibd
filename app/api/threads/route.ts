import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }
  if (!user.organizationProfile.verified) {
    return NextResponse.redirect(new URL("/discover?error=verification", request.url), 303);
  }
  const organizationProfileId = user.organizationProfile.id;

  const form = await request.formData();
  const volunteerProfileId = formValue(form.get("volunteerProfileId"), 64);
  const body = formValue(form.get("body"), 4000);
  const requestedTaskId = formValue(form.get("taskId"), 64);
  const isInvite = formValue(form.get("isInvite")) === "true";

  const volunteer = volunteerProfileId
    ? await prisma.volunteerProfile.findUnique({ where: { id: volunteerProfileId }, select: { id: true } })
    : null;
  if (!volunteer) {
    return NextResponse.redirect(new URL("/discover?error=volunteer", request.url), 303);
  }

  // Only the organization's own tasks can be attached (an attached task grants access to private tasks).
  const task = requestedTaskId
    ? await prisma.task.findFirst({ where: { id: requestedTaskId, organizationId: organizationProfileId }, select: { id: true } })
    : null;

  // 30 new outreach messages per organization per hour.
  if (!rateLimit(`outreach:${organizationProfileId}`, 30, 60 * 60_000)) {
    return NextResponse.redirect(new URL("/discover?error=rate", request.url), 303);
  }

  const key = { volunteerProfileId_organizationProfileId: { volunteerProfileId: volunteer.id, organizationProfileId } };
  const existing = await prisma.messageThread.findUnique({ where: key, select: { id: true, status: true } });

  // A volunteer's decline is respected: the organization cannot re-open the request.
  if (existing?.status === "DECLINED") {
    return NextResponse.redirect(new URL(`/inbox/${existing.id}`, request.url), 303);
  }

  const thread = existing
    ? await prisma.messageThread.update({
        where: { id: existing.id },
        data: {
          // Keep active conversations active; only pending ones stay as requests.
          isInvite: isInvite || undefined,
          taskId: task?.id ?? undefined
        },
        select: { id: true }
      })
    : await prisma.messageThread.create({
        data: { volunteerProfileId: volunteer.id, organizationProfileId, taskId: task?.id ?? null, isInvite, status: "REQUESTED" },
        select: { id: true }
      });

  if (body) {
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderUserId: user.id,
        body,
        type: isInvite ? "INVITE" : "TEXT"
      }
    });
  }

  return NextResponse.redirect(new URL(`/inbox/${thread.id}`, request.url), 303);
}
