import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { generateImpactCv } from "@/lib/ai";
import { ImpactCvEditor } from "@/components/ai/impact-cv-editor";

export const dynamic = "force-dynamic";

export default async function VolunteerCvPage() {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return (
      <PageShell>
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Sign in as a volunteer to view your AI impact CV.</CardContent>
        </Card>
      </PageShell>
    );
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
    return (
      <PageShell>
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Volunteer profile not found.</CardContent>
        </Card>
      </PageShell>
    );
  }

  const generatedCv = await generateImpactCv({
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

  const savedCvRows = await prisma
    .$queryRaw<any[]>`
      SELECT headline, summary, "topSkills", "proofPoints", metrics, "approvalNotes", "approvedByAi", "approvedAt"
      FROM "ImpactCv"
      WHERE "volunteerProfileId" = ${profile.id}
      LIMIT 1
    `
    .catch(() => []);
  const savedCv = savedCvRows[0] ?? null;

  const initialCv = savedCv
    ? {
        headline: savedCv.headline as string,
        summary: savedCv.summary as string,
        topSkills: (savedCv.topSkills as string[]) ?? [],
        proofPoints: (savedCv.proofPoints as string[]) ?? [],
        impactHighlights: [],
        metrics: (savedCv.metrics as string[]) ?? [],
        approvedByAi: Boolean(savedCv.approvedByAi),
        approvalNotes: (savedCv.approvalNotes as string[]) ?? []
      }
    : generatedCv;

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="AI impact CV"
        title="Your verified work, rewritten as hiring proof."
        description="Edit the story, keep the numbers, and let AI approve the final version before you use it."
      />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/volunteer/profile">Back to profile</ButtonLink>
        <ButtonLink href="/marketplace" variant="outline">
          Find more work
        </ButtonLink>
      </div>

      <ImpactCvEditor
        profile={{
          fullName: profile.fullName,
          location: profile.location,
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
            completedAt: item.completedAt.toISOString()
          }))
        }}
        initialCv={initialCv}
        sharePath={`/cv/${profile.id}`}
      />
    </PageShell>
  );
}
