import { NextResponse } from "next/server";
import { OpportunityStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, signSession } from "@/lib/security";
import { formValue, parseBooleanString, slugify, splitCsv } from "@/lib/forms";

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

  const volunteerSkills = splitCsv(formValue(form.get("skills")));
  const volunteerInterests = splitCsv(formValue(form.get("interests")));
  const volunteerLanguages = splitCsv(formValue(form.get("languages")));
  const volunteerAvailability = formValue(form.get("availability"));
  const volunteerBio = formValue(form.get("bio"));
  const volunteerHeadline = formValue(form.get("headline"));
  const volunteerLocation = formValue(form.get("location"));
  const volunteerDiscoverable = parseBooleanString(formValue(form.get("discoverable")) || "true");

  const organizationDescription = formValue(form.get("description")) || "New organization on Vibd.";
  const organizationIndustry = formValue(form.get("industry")) || "General";
  const organizationLocation = formValue(form.get("organizationLocation")) || "Remote";
  const organizationWebsite = formValue(form.get("website"));

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
                  opportunityStatus:
                    (formValue(form.get("opportunityStatus")) as OpportunityStatus) || OpportunityStatus.OPEN_VOLUNTEER_WORK,
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
                  website: organizationWebsite || null,
                  verified: false
                }
              }
            : undefined
      },
      include: { volunteerProfile: true, organizationProfile: true }
    });

    if (createdUser.volunteerProfile && volunteerSkills.length) {
      for (const skillName of volunteerSkills) {
        const skillSlug = slugify(skillName);
        const skill = await tx.skill.upsert({
          where: { slug: skillSlug },
          create: {
            name: skillName,
            slug: skillSlug,
            category: "Self-declared"
          },
          update: {
            name: skillName
          }
        });

        await tx.volunteerSkill.upsert({
          where: {
            volunteerProfileId_skillId: {
              volunteerProfileId: createdUser.volunteerProfile.id,
              skillId: skill.id
            }
          },
          create: {
            volunteerProfileId: createdUser.volunteerProfile.id,
            skillId: skill.id,
            proficiency: 3
          },
          update: {
            proficiency: 3
          }
        });
      }
    }

    return createdUser;
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
