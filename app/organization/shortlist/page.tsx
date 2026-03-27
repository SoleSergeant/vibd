import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ShortlistPage() {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return <PageShell><p className="text-sm text-slate-600">Sign in as an organization to manage your shortlist.</p></PageShell>;
  }

  const shortlist = await prisma.shortlist.findMany({
    where: { organizationProfileId: user.organizationProfile.id },
    include: { volunteerProfile: { include: { skills: { include: { skill: true } }, badges: { include: { badge: true } } } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageShell className="space-y-8">
      <SectionHeading eyebrow="Shortlist" title="Volunteers you want to keep warm." />
      <div className="grid gap-4 lg:grid-cols-2">
        {shortlist.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-lg font-semibold">{entry.volunteerProfile.fullName}</h3>
              <p className="text-sm text-slate-600">{entry.note ?? "Shortlisted for follow-up."}</p>
              <div className="flex flex-wrap gap-2">
                {entry.volunteerProfile.badges.map((badge) => (
                  <Badge key={badge.id}>{badge.badge.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
