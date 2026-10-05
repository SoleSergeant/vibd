import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { VolunteerCard } from "@/components/volunteer-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trustSubmissionSelect, volunteerTrust } from "@/lib/trust";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams
}: {
  searchParams?: {
    skills?: string;
    badge?: string;
    minScore?: string;
    availability?: string;
    language?: string;
    error?: string;
  };
}) {
  const currentUser = await getCurrentUser();
  const organizationProfile = currentUser?.role === "ORGANIZATION" ? currentUser.organizationProfile : null;
  const isOrganization = Boolean(organizationProfile);

  const minScore = Number.parseInt(searchParams?.minScore ?? "", 10);
  const skillsQuery = searchParams?.skills?.trim().slice(0, 80);
  const badgeQuery = searchParams?.badge?.trim().slice(0, 80);
  const languageQuery = searchParams?.language?.trim().slice(0, 40);

  const volunteers = await prisma.volunteerProfile.findMany({
    where: {
      discoverable: true,
      impactScore: Number.isFinite(minScore) ? { gte: minScore } : undefined,
      availability: searchParams?.availability || undefined,
      languages: languageQuery ? { has: languageQuery } : undefined,
      skills: skillsQuery ? { some: { skill: { name: { contains: skillsQuery, mode: "insensitive" } } } } : undefined,
      badges: badgeQuery ? { some: { badge: { name: { contains: badgeQuery, mode: "insensitive" } } } } : undefined
    },
    include: {
      skills: { include: { skill: true } },
      badges: { include: { badge: true } },
      submissions: { select: trustSubmissionSelect },
      _count: { select: { portfolioItems: true } }
    },
    orderBy: [{ impactScore: "desc" }, { ranking: "asc" }],
    take: 60
  });

  const volunteersWithTrust = volunteers.map(({ submissions, _count, ...volunteer }) => {
    const trust = volunteerTrust({
      completedTasks: _count.portfolioItems,
      badgeCount: volunteer.badges.length,
      verified: volunteer.verified,
      submissions
    });
    return { ...volunteer, trustScore: trust.trustScore, trustLabel: trust.trustLabel };
  });

  const topSkills = volunteersWithTrust.flatMap((volunteer) => volunteer.skills.slice(0, 2).map((item) => item.skill.name)).slice(0, 6);

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Talent discovery"
        title="Search volunteers with verified impact."
        description="Organizations can filter by skills, badges, ranking, availability, and language. Volunteers can hide from discovery at any time."
      />

      <Card className="border-[color:rgba(45,138,227,0.18)] bg-[linear-gradient(180deg,rgba(45,138,227,0.06),rgba(255,255,255,1))]">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[color:rgba(21,228,2,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgb(21,160,2)]">
              AI-powered
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Trust-first search
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Discovery ranks volunteers by skills, verification, trust score, and impact so organizations can move faster with less guesswork.
          </p>
          {topSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <Badge key={skill} className="bg-white text-slate-700">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {searchParams?.error ? (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {searchParams.error === "verification"
            ? "Your organization needs to be verified before it can message volunteers. Contact the Vibd team to get verified."
            : searchParams.error === "rate"
              ? "You've sent a lot of outreach recently. Please wait a bit before messaging more volunteers."
              : "That volunteer couldn't be found."}
        </p>
      ) : null}

      {isOrganization ? (
        <form className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-5" method="get">
          <Input name="skills" defaultValue={searchParams?.skills} placeholder="Skills" />
          <Input name="badge" defaultValue={searchParams?.badge} placeholder="Badge" />
          <Input name="minScore" type="number" min="0" defaultValue={searchParams?.minScore} placeholder="Min score" />
          <Input name="language" defaultValue={searchParams?.language} placeholder="Language" />
          <Select name="availability" defaultValue={searchParams?.availability ?? ""}>
            <option value="">Any availability</option>
            <option value="Flexible">Flexible</option>
            <option value="Weekends">Weekends</option>
            <option value="Evenings">Evenings</option>
            <option value="Full-time">Full-time</option>
          </Select>
          <div className="lg:col-span-5">
            <Button type="submit">Search volunteers</Button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Sign in as an organization to search, shortlist, and message volunteers.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {volunteersWithTrust.length ? (
          volunteersWithTrust.map((volunteer) => (
            <VolunteerCard
              key={volunteer.id}
              volunteer={volunteer}
              actions={
                isOrganization ? (
                  <div className="space-y-3">
                    <form action="/api/shortlists" method="post">
                      <input type="hidden" name="volunteerProfileId" value={volunteer.id} />
                      <Input name="note" placeholder="Shortlist note" />
                      <Button type="submit" size="sm" variant="outline" className="mt-2 w-full">
                        Shortlist
                      </Button>
                    </form>
                  </div>
                ) : null
              }
            />
          ))
        ) : (
          <Card className="border-dashed border-slate-300 bg-slate-50">
            <CardContent className="space-y-3 p-6">
              <p className="text-base font-semibold text-slate-950">No volunteers matched your filters.</p>
              <p className="text-sm leading-6 text-slate-600">
                Try widening the filters, or search for a specific skill and Vibd will surface the closest verified profiles.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
