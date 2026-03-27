import { prisma } from "@/lib/db";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { TaskCard } from "@/components/task-card";
import { StatsCard } from "@/components/stats-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [taskCount, volunteerCount, orgCount] = await Promise.all([
    prisma.task.count(),
    prisma.volunteerProfile.count(),
    prisma.organizationProfile.count()
  ]);
  const featuredTasks = await prisma.task.findMany({
    where: { visibility: "PUBLIC", status: "OPEN" },
    include: {
      organization: true,
      taskSkills: { include: { skill: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  return (
    <PageShell className="space-y-16">
      <section className="grid gap-8 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
        <div className="space-y-6">
          <Badge className="w-fit bg-white px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Real work. Real proof. Real opportunities.
          </Badge>
          <div className="space-y-4">
            <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Build a career through impact.
            </h1>
            <p className="max-w-2xl text-balance text-lg leading-8 text-slate-600">
              Vibd helps volunteers prove their skills on real tasks and helps organizations find trusted talent through verified work,
              rankings, and direct outreach.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/signup">Join as volunteer</ButtonLink>
            <ButtonLink href="/signup?role=organization" variant="outline">
              Join as organization
            </ButtonLink>
            <ButtonLink href="/marketplace" variant="secondary">
              Explore workboard
            </ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsCard title="Open tasks" value={`${taskCount}`} description="Live opportunities in the workboard" />
            <StatsCard title="Volunteers" value={`${volunteerCount}`} description="Profiles with verified impact history" />
            <StatsCard title="Organizations" value={`${orgCount}`} description="Teams hiring through work-first proof" />
          </div>
        </div>
        <Card className="grid-backdrop overflow-hidden border-slate-200">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-medium text-slate-500">Core loop</p>
            <div className="space-y-4">
              {[
                ["Work", "Real tasks from organizations"],
                ["Verified", "Accepted submissions turn into proof"],
                ["Ranked", "Impact scores and leaderboards rise"],
                ["Hired", "Organizations contact talent directly"]
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="text-sm text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Why Vibd"
          title="Designed for proof, trust, and hiring."
          description="Volunteers build portfolios from meaningful work. Organizations get a practical way to verify skills, compare talent, and reach out without cold-start friction."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Verified impact portfolios", "Every accepted task can become portfolio proof with feedback, ratings, and completion context."],
            ["Hire after volunteering", "Move from task execution to shortlist, outreach, and direct hiring conversations."],
            ["Talent discovery", "Search by skill, badge, impact score, ranking, language, and availability."]
          ].map(([title, copy]) => (
            <Card key={title}>
              <CardContent className="space-y-2">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-slate-600">{copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Featured work"
          title="Tasks already seeded for a believable demo."
          description="These are public tasks pulled from the live database so the marketplace looks realistic immediately."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {featuredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start here</p>
          <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight text-slate-950">
            Verify work, build rankings, and create hiring pipelines in one place.
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Vibd is an MVP built to demonstrate the product loop and data model, with clean dashboards and role-specific flows for
            volunteers and organizations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/signin">Sign in</ButtonLink>
          <ButtonLink href="/marketplace" variant="outline">
            Explore workboard
          </ButtonLink>
          <ButtonLink href="/discover" variant="secondary">
            Discover talent
          </ButtonLink>
        </div>
      </section>
    </PageShell>
  );
}
