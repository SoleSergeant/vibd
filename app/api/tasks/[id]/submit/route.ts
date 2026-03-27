import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";

async function fileToDataUrl(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) {
    return NextResponse.redirect(new URL("/marketplace", request.url), 303);
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
      return NextResponse.redirect(new URL("/marketplace", request.url), 303);
    }
  }

  const form = await request.formData();
  const textSummary = formValue(form.get("textSummary"));
  const attachmentUrl = formValue(form.get("attachmentUrl")) || null;
  const assignmentFile = form.get("assignmentFile");
  const uploadedAttachmentUrl = assignmentFile instanceof File && assignmentFile.size > 0 ? await fileToDataUrl(assignmentFile) : null;

  await prisma.submission.upsert({
    where: {
      taskId_volunteerProfileId: {
        taskId: params.id,
        volunteerProfileId: user.volunteerProfile.id
      }
    },
    update: {
      textSummary,
      attachmentUrl: uploadedAttachmentUrl ?? attachmentUrl,
      status: "SUBMITTED"
    },
    create: {
      taskId: params.id,
      volunteerProfileId: user.volunteerProfile.id,
      textSummary,
      attachmentUrl: uploadedAttachmentUrl ?? attachmentUrl
    }
  });

  await prisma.taskApplication.upsert({
    where: {
      taskId_volunteerProfileId: {
        taskId: params.id,
        volunteerProfileId: user.volunteerProfile.id
      }
    },
    update: { status: "APPLIED" },
    create: {
      taskId: params.id,
      volunteerProfileId: user.volunteerProfile.id,
      status: "APPLIED"
    }
  });

  return NextResponse.redirect(new URL(`/tasks/${params.id}`, request.url), 303);
}
