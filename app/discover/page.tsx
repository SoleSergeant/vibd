import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { VolunteerCard } from "@/components/volunteer-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OutreachComposer } from "@/components/ai/outreach-composer";

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
  };
}) {
  const currentUser = await getCurrentUser();
  const organizationProfile = currentUser?.role === "ORGANIZATION" ? currentUser.organizationProfile : null;
  const isOrganization = Boolean(organizationProfile);
  const organizationTasks = organizationProfile
    ? await prisma.task.findMany({
        where: { organizationId: organizationProfile.id },
        orderBy: { createdAt: "desc" },
        take: 6
      })
    : [];
  const volunteers = await prisma.volunteerProfile.findMany({
    where: {
      discoverable: true,
      impactScore: searchParams?.minScore ? { gte: Number(searchParams.minScore) } : undefined,
      availability: searchParams?.availability || undefined,
      languages: searchParams?.language ? { has: searchParams.language } : undefined,
      skills: searchParams?.skills
        ? {
            some: { skill: { name: { contains: searchParams.skills, mode: "insensitive" } } }
          }
        : undefined,
      badges: searchParams?.badge
        ? {
            some: { badge: { name: { contains: searchParams.badge, mode: "insensitive" } } }
          }
        : undefined
    },
    include: {
      skills: { include: { skill: true } },
      badges: { include: { badge: true } }
    },
    orderBy: [{ impactScore: "desc" }, { ranking: "asc" }]
  });

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Talent discovery"
        title="Search volunteers with verified impact."
        description="Organizations can filter by skills, badges, ranking, availability, and language. Volunteers can hide from discovery at any time."
      />

      {isOrganization ? (
        <form className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-5" method="get">
          <Input name="skills" defaultValue={searchParams?.skills} placeholder="Skills" />
          <Input name="badge" defaultValue={searchParams?.badge} placeholder="Badge" />
          <Input name="minScore" defaultValue={searchParams?.minScore} placeholder="Min score" />
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
        {volunteers.map((volunteer) => (
          <VolunteerCard
            key={volunteer.id}
            volunteer={volunteer}
            actions={
              isOrganization ? (
                <div className="space-y-3">
                  <OutreachComposer
                    volunteerProfileId={volunteer.id}
                    volunteerName={volunteer.fullName}
                    organizationName={organizationProfile?.name ?? "your organization"}
                    taskOptions={organizationTasks.map((task) => ({ id: task.id, title: task.title }))}
                  />
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
        ))}
      </div>
    </PageShell>
  );
}
