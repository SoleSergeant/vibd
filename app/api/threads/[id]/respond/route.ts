import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.id },
    include: { volunteerProfile: true }
  });
  if (!thread || thread.volunteerProfile.userId !== user.id) {
    return NextResponse.redirect(new URL("/volunteer/inbox", request.url), 303);
  }

  const response = formValue((await request.formData()).get("response"));
  const accepted = response === "ACCEPT";

  await prisma.messageThread.update({
    where: { id: params.id },
    data: { status: accepted ? "ACTIVE" : "DECLINED", requiresAcceptance: !accepted }
  });

  await prisma.message.create({
    data: {
      threadId: params.id,
      senderUserId: user.id,
      body: accepted ? "Message request accepted." : "Message request declined.",
      type: accepted ? "ACCEPT" : "DECLINE"
    }
  });

  return NextResponse.redirect(new URL(`/inbox/${params.id}`, request.url), 303);
}
