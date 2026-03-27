import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }
  if (!user.organizationProfile.verified) {
    return NextResponse.redirect(new URL("/discover?error=verification", request.url), 303);
  }

  const form = await request.formData();
  const volunteerProfileId = formValue(form.get("volunteerProfileId"));
  const body = formValue(form.get("body"));
  const taskId = formValue(form.get("taskId")) || null;
  const isInvite = formValue(form.get("isInvite")) === "true";

  const thread = await prisma.messageThread.upsert({
    where: {
      volunteerProfileId_organizationProfileId: {
        volunteerProfileId,
        organizationProfileId: user.organizationProfile.id
      }
    },
    update: {
      isInvite,
      status: "REQUESTED",
      taskId: taskId || undefined
    },
    create: {
      volunteerProfileId,
      organizationProfileId: user.organizationProfile.id,
      taskId,
      isInvite,
      status: "REQUESTED"
    }
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
