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
  await prisma.organizationProfile.update({
    where: { id: user.organizationProfile.id },
    data: {
      name: formValue(form.get("name")) || user.organizationProfile.name,
      description: formValue(form.get("description")) || user.organizationProfile.description,
      industry: formValue(form.get("industry")) || user.organizationProfile.industry,
      location: formValue(form.get("location")) || user.organizationProfile.location,
      website: formValue(form.get("website")) || null
    }
  });

  return NextResponse.redirect(new URL("/organization/profile", request.url), 303);
}
