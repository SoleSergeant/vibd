import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signSession } from "@/lib/security";
import { formValue } from "@/lib/forms";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = formValue(form.get("name"));
  const email = formValue(form.get("email")).toLowerCase();
  const password = formValue(form.get("password"));
  const role = formValue(form.get("role")) === "ORGANIZATION" ? "ORGANIZATION" : "VOLUNTEER";

  if (!name || !email || !password) {
    return NextResponse.redirect(new URL("/signup?error=missing", request.url), 303);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.redirect(new URL("/signup?error=exists", request.url), 303);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: hashPassword(password),
      volunteerProfile:
        role === "VOLUNTEER"
          ? {
              create: {
                fullName: name,
                bio: "Aspiring contributor building a verified impact portfolio.",
                headline: "Open to real tasks and meaningful projects.",
                interests: ["community", "operations"],
                languages: ["English"],
                availability: "Flexible",
                opportunityStatus: "OPEN_VOLUNTEER_WORK",
                discoverable: true
              }
            }
          : undefined,
      organizationProfile:
        role === "ORGANIZATION"
          ? {
              create: {
                name,
                description: "New organization on VibedWork.",
                industry: "General",
                location: "Remote",
                verified: false
              }
            }
          : undefined
    }
  });

  const response = NextResponse.redirect(
    new URL(role === "ORGANIZATION" ? "/organization/dashboard" : "/volunteer/dashboard", request.url),
    303
  );
  response.cookies.set("vibedwork_session", signSession({ userId: user.id, role: user.role }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}
