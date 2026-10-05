import { NextResponse } from "next/server";
import { OpportunityStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue, parseBooleanString, parseEnum, splitCsv } from "@/lib/forms";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const form = await request.formData();
  const profile = user.volunteerProfile;
  await prisma.volunteerProfile.update({
    where: { id: profile.id },
    data: {
      fullName: formValue(form.get("fullName"), 120) || profile.fullName,
      headline: formValue(form.get("headline"), 200) || null,
      bio: formValue(form.get("bio"), 2000) || profile.bio,
      interests: splitCsv(formValue(form.get("interests"))),
      languages: splitCsv(formValue(form.get("languages"))),
      availability: formValue(form.get("availability"), 200) || profile.availability,
      // An emptied field clears the location instead of silently keeping the old one.
      location: formValue(form.get("location"), 120) || null,
      opportunityStatus: parseEnum(OpportunityStatus, formValue(form.get("opportunityStatus")), profile.opportunityStatus),
      discoverable: parseBooleanString(formValue(form.get("discoverable")) || "true")
    }
  });

  return NextResponse.redirect(new URL("/volunteer/profile", request.url), 303);
}
