import { NextResponse } from "next/server";
import { OpportunityStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue, parseBooleanString, splitCsv } from "@/lib/forms";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const form = await request.formData();
  await prisma.volunteerProfile.update({
    where: { id: user.volunteerProfile.id },
    data: {
      fullName: formValue(form.get("fullName")) || user.volunteerProfile.fullName,
      headline: formValue(form.get("headline")) || null,
      bio: formValue(form.get("bio")) || user.volunteerProfile.bio,
      interests: splitCsv(formValue(form.get("interests"))),
      languages: splitCsv(formValue(form.get("languages"))),
      availability: formValue(form.get("availability")) || user.volunteerProfile.availability,
      location: formValue(form.get("location")) || user.volunteerProfile.location,
      opportunityStatus: formValue(form.get("opportunityStatus")) as OpportunityStatus,
      discoverable: parseBooleanString(formValue(form.get("discoverable")) || "true")
    }
  });

  return NextResponse.redirect(new URL("/volunteer/profile", request.url), 303);
}
