import { NextResponse } from "next/server";
import { OpportunityStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formValue } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifyPassword } from "@/lib/security";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = formValue(form.get("email"), 254).toLowerCase();
  const password = formValue(form.get("password"), 200);

  // 10 attempts per IP+email per 15 minutes.
  if (!rateLimit(`signin:${clientIp(request)}:${email}`, 10, 15 * 60_000)) {
    return NextResponse.redirect(new URL("/signin?error=rate", request.url), 303);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { volunteerProfile: { select: { id: true } }, organizationProfile: { select: { id: true } } }
  });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(new URL("/signin?error=invalid", request.url), 303);
  }

  if (user.role === "ORGANIZATION" && !user.organizationProfile) {
    await prisma.organizationProfile.create({
      data: {
        userId: user.id,
        name: user.name,
        description: "Organization profile created automatically from sign-in.",
        industry: "General",
        location: "Remote",
        website: null,
        verified: false
      }
    });
  }

  if (user.role === "VOLUNTEER" && !user.volunteerProfile) {
    await prisma.volunteerProfile.create({
      data: {
        userId: user.id,
        fullName: user.name,
        bio: "Volunteer profile created automatically from sign-in.",
        headline: "Open to real tasks and meaningful projects.",
        interests: ["community"],
        languages: ["English"],
        availability: "Flexible",
        opportunityStatus: OpportunityStatus.OPEN_VOLUNTEER_WORK,
        discoverable: true,
        location: null
      }
    });
  }

  const response = NextResponse.redirect(
    new URL(user.role === "ORGANIZATION" ? "/organization/dashboard" : "/volunteer/dashboard", request.url),
    303
  );
  response.cookies.set(SESSION_COOKIE, signSession({ userId: user.id, role: user.role }), sessionCookieOptions());
  return response;
}
