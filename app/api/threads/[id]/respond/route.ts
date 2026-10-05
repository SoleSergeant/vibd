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
  if (response !== "ACCEPT" && response !== "DECLINE") {
    return NextResponse.redirect(new URL(`/inbox/${params.id}`, request.url), 303);
  }
  const accepted = response === "ACCEPT";
  // Nothing to do if the thread is already in the requested state.
  if ((accepted && thread.status === "ACTIVE") || (!accepted && thread.status === "DECLINED")) {
    return NextResponse.redirect(new URL(`/inbox/${params.id}`, request.url), 303);
  }

  await prisma.$transaction([
    prisma.messageThread.update({
      where: { id: params.id },
      data: { status: accepted ? "ACTIVE" : "DECLINED", requiresAcceptance: !accepted }
    }),
    prisma.message.create({
      data: {
        threadId: params.id,
        senderUserId: user.id,
        body: accepted ? "Message request accepted." : "Message request declined.",
        type: accepted ? "ACCEPT" : "DECLINE"
      }
    })
  ]);

  return NextResponse.redirect(new URL(`/inbox/${params.id}`, request.url), 303);
}
