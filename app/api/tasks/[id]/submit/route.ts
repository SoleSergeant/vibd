import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";
import { taskAcceptsWork, volunteerCanViewTask } from "@/lib/task-access";
import { sanitizeUserUrl } from "@/lib/url";

// Files are stored inline as data URLs, so keep them small. Move to object storage for anything bigger.
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

async function fileToDataUrl(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    select: { id: true, visibility: true, organizationId: true, status: true }
  });
  if (!task || !(await volunteerCanViewTask(user.volunteerProfile.id, task))) {
    return NextResponse.redirect(new URL("/marketplace", request.url), 303);
  }
  if (!taskAcceptsWork(task)) {
    return NextResponse.redirect(new URL(`/tasks/${task.id}?error=closed`, request.url), 303);
  }

  const form = await request.formData();
  const textSummary = formValue(form.get("textSummary"), 10_000);
  if (!textSummary) {
    return NextResponse.redirect(new URL(`/tasks/${task.id}?error=summary`, request.url), 303);
  }

  const rawUrl = formValue(form.get("attachmentUrl"), 2000);
  const linkUrl = sanitizeUserUrl(rawUrl);
  if (rawUrl && !linkUrl) {
    return NextResponse.redirect(new URL(`/tasks/${task.id}?error=link`, request.url), 303);
  }

  const assignmentFile = form.get("assignmentFile");
  let uploadedUrl: string | null = null;
  if (assignmentFile instanceof File && assignmentFile.size > 0) {
    if (assignmentFile.size > MAX_UPLOAD_BYTES) {
      return NextResponse.redirect(new URL(`/tasks/${task.id}?error=filesize`, request.url), 303);
    }
    if (!ALLOWED_UPLOAD_TYPES.has(assignmentFile.type)) {
      return NextResponse.redirect(new URL(`/tasks/${task.id}?error=filetype`, request.url), 303);
    }
    uploadedUrl = await fileToDataUrl(assignmentFile);
  }

  const key = { taskId_volunteerProfileId: { taskId: task.id, volunteerProfileId: user.volunteerProfile.id } };
  const existing = await prisma.submission.findUnique({ where: key, select: { status: true } });
  if (existing?.status === "ACCEPTED") {
    return NextResponse.redirect(new URL(`/tasks/${task.id}?error=accepted`, request.url), 303);
  }
  const attachmentUrl = uploadedUrl ?? linkUrl;

  await prisma.$transaction([
    prisma.submission.upsert({
      where: key,
      update: { textSummary, attachmentUrl, status: "SUBMITTED" },
      create: { taskId: task.id, volunteerProfileId: user.volunteerProfile.id, textSummary, attachmentUrl }
    }),
    prisma.taskApplication.upsert({
      where: key,
      update: { status: "APPLIED" },
      create: { taskId: task.id, volunteerProfileId: user.volunteerProfile.id, status: "APPLIED" }
    })
  ]);

  return NextResponse.redirect(new URL(`/tasks/${task.id}`, request.url), 303);
}
