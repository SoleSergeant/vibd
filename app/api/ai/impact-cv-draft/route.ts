import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateImpactCv } from "@/lib/ai";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.volunteerProfile.findUnique({
    where: { id: user.volunteerProfile.id },
    include: {
      skills: { include: { skill: true } },
      badges: { include: { badge: true } },
      portfolioItems: {
        include: {
          task: { include: { organization: true } },
          submission: { include: { rating: true } }
        },
        orderBy: { completedAt: "desc" }
      }
    }
  });

  if (!profile) {
    return NextResponse.json({ error: "Volunteer profile not found" }, { status: 404 });
  }

  const cv = await generateImpactCv({
    volunteer: {
      fullName: profile.fullName,
      location: profile.location,
      headline: profile.headline,
      bio: profile.bio,
      interests: profile.interests,
      availability: profile.availability,
      opportunityStatus: profile.opportunityStatus,
      impactScore: profile.impactScore,
      ranking: profile.ranking,
      verified: profile.verified,
      badges: profile.badges.map((entry) => entry.badge.name),
      skills: profile.skills.map((item) => ({ name: item.skill.name, proficiency: item.proficiency })),
      portfolioItems: profile.portfolioItems.map((item) => ({
        taskTitle: item.task.title,
        organizationName: item.task.organization.name,
        summary: item.summary,
        feedback: item.feedback,
        rating: item.rating ?? 0,
        completedAt: item.completedAt
      }))
    }
  });

  return NextResponse.json({ cv });
}
