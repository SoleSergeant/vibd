import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const form = await request.formData();
  const volunteerProfileId = formValue(form.get("volunteerProfileId"));
  const note = formValue(form.get("note")) || null;

  await prisma.shortlist.upsert({
    where: {
      organizationProfileId_volunteerProfileId: {
        organizationProfileId: user.organizationProfile.id,
        volunteerProfileId
      }
    },
    update: { note },
    create: {
      organizationProfileId: user.organizationProfile.id,
      volunteerProfileId,
      note
    }
  });

  return NextResponse.redirect(new URL("/organization/shortlist", request.url), 303);
}
