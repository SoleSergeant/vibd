import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formValue } from "@/lib/forms";
import { sanitizeUserUrl } from "@/lib/url";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.redirect(new URL("/signin", request.url), 303);
  }

  const form = await request.formData();
  await prisma.organizationProfile.update({
    where: { id: user.organizationProfile.id },
    data: {
      name: formValue(form.get("name"), 120) || user.organizationProfile.name,
      description: formValue(form.get("description"), 2000) || user.organizationProfile.description,
      industry: formValue(form.get("industry"), 120) || user.organizationProfile.industry,
      location: formValue(form.get("location"), 120) || user.organizationProfile.location,
      website: sanitizeUserUrl(formValue(form.get("website"), 500))
    }
  });

  return NextResponse.redirect(new URL("/organization/profile", request.url), 303);
}
