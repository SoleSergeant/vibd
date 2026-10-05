import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateHrToolkit } from "@/lib/ai";
import { aiRateLimited } from "@/lib/rate-limit";
import { summarizeSubmissions, trustSubmissionSelect } from "@/lib/trust";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = aiRateLimited(user.id);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const volunteerProfileId = String(body?.volunteerProfileId || "").trim();
  if (!volunteerProfileId) {
    return NextResponse.json({ error: "volunteerProfileId is required" }, { status: 400 });
  }

  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { id: volunteerProfileId },
    include: {
      skills: { include: { skill: true } },
      badges: { include: { badge: true } },
      portfolioItems: {
        include: {
          task: { include: { organization: true } },
          submission: { select: { rating: true } }
        },
        orderBy: { completedAt: "desc" }
      },
      submissions: { select: trustSubmissionSelect }
    }
  });

  if (!volunteer) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  const completedTasks = volunteer.portfolioItems.length;
  const stats = summarizeSubmissions(volunteer.submissions);

  const toolkit = await generateHrToolkit({
    organizationName: user.organizationProfile.name,
    volunteer: {
      fullName: volunteer.fullName,
      bio: volunteer.bio,
      headline: volunteer.headline,
      verified: volunteer.verified,
      impactScore: volunteer.impactScore,
      ranking: volunteer.ranking,
      badgeCount: volunteer.badges.length,
      completedTasks,
      acceptedTasks: stats.acceptedTasks,
      averageRating: stats.averageRating,
      onTimeRate: stats.onTimeRate,
      averageSubmissionLagDays: stats.averageSubmissionLagDays,
      averageReviewDays: stats.averageReviewDays,
      latestWork: volunteer.portfolioItems.slice(0, 3).map((item) => item.taskTitle),
      skills: volunteer.skills.map((item) => item.skill.name),
      interests: volunteer.interests,
      location: volunteer.location
    }
  });

  return NextResponse.json(toolkit);
}
