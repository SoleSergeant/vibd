import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          submission: { select: { rating: true } }
        },
        orderBy: { completedAt: "desc" }
      }
    }
  });

  if (!profile) {
    notFound();
  }

  // Volunteers who hide from discovery keep their CV private (still visible to themselves).
  if (!profile.discoverable) {
    const viewer = await getCurrentUser();
    if (viewer?.volunteerProfile?.id !== profile.id) notFound();
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
          eyebrow="Volunteer profile"
          title={profile.fullName}
          description={profile.headline ?? "This volunteer hasn't published an AI-approved impact CV yet, so this is their verified profile."}
        />
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap gap-2">
              <Badge>Impact {profile.impactScore}</Badge>
              <Badge>Rank #{profile.ranking || "new"}</Badge>
              {profile.location ? <Badge>{profile.location}</Badge> : null}
              {profile.badges.map((entry) => (
                <Badge key={entry.badgeId}>{entry.badge.name}</Badge>
              ))}
            </div>
            <p className="text-sm leading-6 text-slate-600">{profile.bio}</p>
            {profile.skills.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((item) => (
                  <Badge key={item.skillId} className="bg-white">
                    {item.skill.name}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <h3 className="text-lg font-semibold">Verified work</h3>
            {profile.portfolioItems.length ? (
              profile.portfolioItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-950">{item.taskTitle}</p>
                  <p className="text-sm text-slate-500">
                    {item.organizationName} · {item.rating}/5
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No accepted work yet.</p>
            )}
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
