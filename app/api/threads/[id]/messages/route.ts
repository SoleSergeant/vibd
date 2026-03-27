import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.id },
    include: { volunteerProfile: true, organizationProfile: true }
  });
  if (!thread) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const canWrite =
    (user.role === "VOLUNTEER" && thread.volunteerProfile.userId === user.id) ||
    (user.role === "ORGANIZATION" && thread.organizationProfile.userId === user.id);
  if (!canWrite || thread.status !== "ACTIVE") {
    return NextResponse.redirect(new URL(`/inbox/${params.id}`, request.url), 303);
  }

  const body = formValue((await request.formData()).get("body"));
  if (!body) {
    return NextResponse.redirect(new URL(`/inbox/${params.id}`, request.url), 303);
  }

  await prisma.message.create({
    data: {
      threadId: params.id,
      senderUserId: user.id,
      body,
      type: "TEXT"
    }
  });

  return NextResponse.redirect(new URL(`/inbox/${params.id}`, request.url), 303);
}
