import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PublicImpactCv } from "@/components/ai/public-impact-cv";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { shareId: string };
};

export default async function PublicImpactCvPage({ params }: PageProps) {
  const { shareId } = params;

  const profile = await prisma.volunteerProfile.findUnique({
    where: { id: shareId },
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
    notFound();
  }

  const rows = await prisma
    .$queryRaw<any[]>`
      SELECT headline, summary, "topSkills", "proofPoints", metrics, "approvalNotes", "approvedByAi", "approvedAt"
      FROM "ImpactCv"
      WHERE "volunteerProfileId" = ${profile.id}
      LIMIT 1
    `
    .catch(() => []);
  const savedCv = rows[0] ?? null;

  if (!savedCv || !savedCv.approvedByAi) {
    return (
      <PageShell className="space-y-8">
        <SectionHeading
          eyebrow="Impact CV"
          title="This CV has not been published yet."
          description="The volunteer can still edit and approve it inside Vibd before sharing a public link."
        />
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <p className="text-sm text-slate-600">There is no approved public CV for this volunteer yet.</p>
            <ButtonLink href="/signin">Sign in</ButtonLink>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Public impact CV"
        title={`${profile.fullName}'s verified work profile`}
        description="A public proof-based CV built from verified tasks, ratings, and AI-approved evidence."
      />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/signin">Sign in to Vibd</ButtonLink>
        <ButtonLink href="/marketplace" variant="outline">
          Explore workboard
        </ButtonLink>
      </div>

      <PublicImpactCv
        profile={{
          fullName: profile.fullName,
          location: profile.location,
          availability: profile.availability,
          impactScore: profile.impactScore,
          ranking: profile.ranking,
          verified: profile.verified,
          badges: profile.badges.map((entry) => entry.badge.name),
          skills: profile.skills.map((item) => ({ name: item.skill.name, proficiency: item.proficiency })),
          portfolioItems: profile.portfolioItems.map((item) => ({
            taskTitle: item.task.title,
            organizationName: item.task.organization.name,
            rating: item.rating ?? 0,
            completedAt: item.completedAt
          }))
        }}
        cv={{
          headline: savedCv.headline as string,
          summary: savedCv.summary as string,
          topSkills: (savedCv.topSkills as string[]) ?? [],
          proofPoints: (savedCv.proofPoints as string[]) ?? [],
          impactHighlights: [],
          metrics: (savedCv.metrics as string[]) ?? [],
          suggestedTitle: `Impact CV for ${profile.fullName}`,
          approvedByAi: Boolean(savedCv.approvedByAi),
          approvalNotes: (savedCv.approvalNotes as string[]) ?? [],
          approvedAt: savedCv.approvedAt ? new Date(savedCv.approvedAt).toISOString() : null
        }}
      />
    </PageShell>
  );
}
