import { NextResponse } from "next/server";
import { OpportunityStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, hashPassword, sessionCookieOptions, signSession } from "@/lib/security";
import { formValue, isValidEmail, parseBooleanString, parseEnum, splitCsv } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { upsertSkills } from "@/lib/skills";
import { sanitizeUserUrl } from "@/lib/url";

function fail(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/signup?error=${error}`, request.url), 303);
}

export async function POST(request: Request) {
  if (!rateLimit(`signup:${clientIp(request)}`, 5, 60 * 60_000)) {
    return fail(request, "rate");
  }

  const form = await request.formData();
  const name = formValue(form.get("name"), 120);
  const email = formValue(form.get("email"), 254).toLowerCase();
  const password = formValue(form.get("password"), 200);
  const role = formValue(form.get("role")) === "ORGANIZATION" ? "ORGANIZATION" : "VOLUNTEER";

  if (!name || !email || !password) return fail(request, "missing");
  if (!isValidEmail(email)) return fail(request, "email");
  if (password.length < 8) return fail(request, "password");

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return fail(request, "exists");

  const volunteerSkills = splitCsv(formValue(form.get("skills")));
  const volunteerInterests = splitCsv(formValue(form.get("interests")));
  const volunteerLanguages = splitCsv(formValue(form.get("languages")));
  const volunteerAvailability = formValue(form.get("availability"), 200);
  const volunteerBio = formValue(form.get("bio"), 2000);
  const volunteerHeadline = formValue(form.get("headline"), 200);
  const volunteerLocation = formValue(form.get("location"), 120);
  const volunteerDiscoverable = parseBooleanString(formValue(form.get("discoverable")) || "true");
  const opportunityStatus = parseEnum(OpportunityStatus, formValue(form.get("opportunityStatus")), OpportunityStatus.OPEN_VOLUNTEER_WORK);

  const organizationDescription = formValue(form.get("description"), 2000) || "New organization on Vibd.";
  const organizationIndustry = formValue(form.get("industry"), 120) || "General";
  const organizationLocation = formValue(form.get("organizationLocation"), 120) || "Remote";
  const organizationWebsite = sanitizeUserUrl(formValue(form.get("website"), 500));

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
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
                  bio: volunteerBio || "Aspiring contributor building a verified impact portfolio.",
                  headline: volunteerHeadline || "Open to real tasks and meaningful projects.",
                  interests: volunteerInterests.length ? volunteerInterests : ["community", "operations"],
                  languages: volunteerLanguages.length ? volunteerLanguages : ["English"],
                  availability: volunteerAvailability || "Flexible",
                  opportunityStatus,
                  discoverable: volunteerDiscoverable,
                  location: volunteerLocation || null
                }
              }
            : undefined,
        organizationProfile:
          role === "ORGANIZATION"
            ? {
                create: {
                  name,
                  description: organizationDescription,
                  industry: organizationIndustry,
                  location: organizationLocation,
                  website: organizationWebsite,
                  verified: false
                }
              }
            : undefined
      },
      include: { volunteerProfile: { select: { id: true } } }
    });

    if (createdUser.volunteerProfile && volunteerSkills.length) {
      const skills = await upsertSkills(tx, volunteerSkills, "Self-declared");
      await tx.volunteerSkill.createMany({
        data: skills.map((skill) => ({
          volunteerProfileId: createdUser.volunteerProfile!.id,
          skillId: skill.id,
          proficiency: 3
        })),
        skipDuplicates: true
      });
    }

    return createdUser;
  });

  const response = NextResponse.redirect(
    new URL(role === "ORGANIZATION" ? "/organization/dashboard" : "/volunteer/dashboard", request.url),
    303
  );
  response.cookies.set(SESSION_COOKIE, signSession({ userId: user.id, role: user.role }), sessionCookieOptions());
  return response;
}
