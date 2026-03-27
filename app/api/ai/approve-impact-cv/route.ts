import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { approveImpactCv } from "@/lib/ai";

function toList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function textArraySql(values: string[]) {
  if (!values.length) {
    return Prisma.sql`ARRAY[]::text[]`;
  }
  return Prisma.sql`ARRAY[${Prisma.join(values.map((item) => Prisma.sql`${item}`))}]::text[]`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const draft = body?.draft;
  if (!draft) {
    return NextResponse.json({ error: "draft is required" }, { status: 400 });
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

  const approved = await approveImpactCv({
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
    },
    draft: {
      headline: String(draft.headline || "").trim(),
      summary: String(draft.summary || "").trim(),
      topSkills: toList(draft.topSkills),
      proofPoints: toList(draft.proofPoints),
      impactHighlights: toList(draft.impactHighlights),
      metrics: toList(draft.metrics),
      suggestedTitle: String(draft.suggestedTitle || `Impact CV for ${profile.fullName}`).trim()
    }
  });

  const [saved] = await prisma.$queryRaw<
    Array<{
      headline: string;
      summary: string;
      topSkills: string[];
      proofPoints: string[];
      metrics: string[];
      approvalNotes: string[];
      approvedByAi: boolean;
    }>
  >(Prisma.sql`
    INSERT INTO "ImpactCv" (
      "id",
      "volunteerProfileId",
      "headline",
      "summary",
      "topSkills",
      "proofPoints",
      "metrics",
      "approvalNotes",
      "approvedByAi",
      "approvedAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${profile.id},
      ${approved.headline},
      ${approved.summary},
      ${textArraySql(approved.topSkills)},
      ${textArraySql(approved.proofPoints)},
      ${textArraySql(approved.metrics)},
      ${textArraySql(approved.approvalNotes)},
      ${approved.approvedByAi},
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT ("volunteerProfileId")
    DO UPDATE SET
      "headline" = EXCLUDED."headline",
      "summary" = EXCLUDED."summary",
      "topSkills" = EXCLUDED."topSkills",
      "proofPoints" = EXCLUDED."proofPoints",
      "metrics" = EXCLUDED."metrics",
      "approvalNotes" = EXCLUDED."approvalNotes",
      "approvedByAi" = EXCLUDED."approvedByAi",
      "approvedAt" = EXCLUDED."approvedAt",
      "updatedAt" = NOW()
    RETURNING
      "headline",
      "summary",
      "topSkills",
      "proofPoints",
      "metrics",
      "approvalNotes",
      "approvedByAi"
  `);

  return NextResponse.json({
    cv: {
      headline: saved.headline,
      summary: saved.summary,
      topSkills: saved.topSkills,
      proofPoints: saved.proofPoints,
      impactHighlights: approved.impactHighlights,
      metrics: saved.metrics,
      suggestedTitle: approved.suggestedTitle,
      approvalNotes: saved.approvalNotes,
      approvedByAi: saved.approvedByAi
    }
  });
}
