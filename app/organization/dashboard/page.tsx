import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/task-card";
import { ThreadCard } from "@/components/thread-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trustSubmissionSelect, volunteerTrust } from "@/lib/trust";
import { HrToolsPanel } from "@/components/ai/hr-tools";

export const dynamic = "force-dynamic";

export default async function OrganizationDashboardPage() {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return (
      <PageShell>
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Sign in as an organization to access this dashboard.</CardContent>
        </Card>
      </PageShell>
    );
  }

  const [tasks, submissions, shortlist, threads, threadCount, volunteers] = await Promise.all([
    prisma.task.findMany({
      where: { organizationId: user.organizationProfile.id },
      include: { organization: true, taskSkills: { include: { skill: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.submission.findMany({
      where: { task: { organizationId: user.organizationProfile.id } },
      select: {
        id: true,
        status: true,
        task: { select: { title: true } },
        volunteerProfile: { select: { fullName: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.shortlist.findMany({
      where: { organizationProfileId: user.organizationProfile.id },
      include: { volunteerProfile: { include: { skills: { include: { skill: true } }, badges: { include: { badge: true } } } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.messageThread.findMany({
      where: { organizationProfileId: user.organizationProfile.id },
      include: {
        volunteerProfile: true,
        organizationProfile: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" },
      take: 3
    }),
    prisma.messageThread.count({ where: { organizationProfileId: user.organizationProfile.id } }),
    prisma.volunteerProfile.findMany({
      where: { discoverable: true },
      include: {
        skills: { include: { skill: true } },
        badges: { include: { badge: true } },
        submissions: { select: trustSubmissionSelect },
        _count: { select: { portfolioItems: true } }
      },
      take: 3,
      orderBy: { impactScore: "desc" }
    })
  ]);

  const volunteersWithTrust = volunteers.map(({ submissions, _count, ...volunteer }) => {
    const trust = volunteerTrust({
      completedTasks: _count.portfolioItems,
      badgeCount: volunteer.badges.length,
      verified: volunteer.verified,
      submissions
    });
    return { ...volunteer, trustScore: trust.trustScore, trustLabel: trust.trustLabel };
  });

  const featuredVolunteer = volunteersWithTrust[0] ?? null;

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Organization dashboard"
        title={user.organizationProfile.name}
        description="Post work, review submissions, shortlist volunteers, and continue conversations."
      />
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[color:rgba(21,228,2,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgb(21,160,2)]">
                AI-powered
              </span>
              <span className="rounded-full bg-[color:rgba(45,138,227,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:hsl(var(--brand-blue))]">
                Post work
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Fast start
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-slate-950">
                Post a work brief in under a minute.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Start from a preset, fill only the essentials, and let Vibd handle the rest with AI-assisted structure and live preview.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/organization/tasks/new">Post work now</ButtonLink>
              <ButtonLink href="/organization/tasks/new" variant="outline">
                Open quick post flow
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4">
            {[
              ["1", "Choose a preset"],
              ["2", "Edit the brief"],
              ["3", "Publish and share"]
            ].map(([step, label]) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:rgba(45,138,227,0.12)] text-sm font-semibold text-[color:hsl(var(--brand-blue))]">
                  {step}
                </div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/organization/tasks/new">Post work</ButtonLink>
        <ButtonLink href="/organization/submissions" variant="outline">
          Review submissions
        </ButtonLink>
        <ButtonLink href="/organization/discover" variant="secondary">
          Discover talent
        </ButtonLink>
        <ButtonLink href="/organization/shortlist" variant="outline">
          Shortlist
        </ButtonLink>
        <ButtonLink href="/organization/profile" variant="ghost">
          Profile
        </ButtonLink>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Live tasks" value={`${tasks.length}`} />
        <StatsCard title="Submissions" value={`${submissions.length}`} />
        <StatsCard title="Shortlisted" value={`${shortlist.length}`} />
        <StatsCard title="Threads" value={`${threadCount}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionHeading title="Posted tasks" />
          {tasks.length ? (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-300 bg-slate-50">
              <CardContent className="space-y-3 p-6">
                <p className="text-base font-semibold text-slate-950">No work posted yet.</p>
                <p className="text-sm leading-6 text-slate-600">
                  Start with a simple brief and Vibd will structure it into a task volunteers can understand quickly.
                </p>
                <ButtonLink href="/organization/tasks/new">Post your first work brief</ButtonLink>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <SectionHeading title="Recommended volunteers" />
          {volunteersWithTrust.length ? (
            <div className="space-y-4">
              {volunteersWithTrust.map((volunteer) => (
                <Card key={volunteer.id}>
                  <CardContent className="space-y-2 p-4">
                    <p className="font-medium text-slate-950">{volunteer.fullName}</p>
                    <p className="text-sm text-slate-500">{volunteer.impactScore} impact score</p>
                    <p className="text-sm text-slate-500">
                      {volunteer.trustLabel} · {volunteer.trustScore}/100 trust
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-3">{volunteer.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-300 bg-slate-50">
              <CardContent className="space-y-3 p-6">
                <p className="text-base font-semibold text-slate-950">No recommendations yet.</p>
                <p className="text-sm leading-6 text-slate-600">
                  Post a task or broaden your filters and Vibd will surface volunteers with the right trust and skill signals.
                </p>
                <ButtonLink href="/organization/discover" variant="outline">
                  Open talent search
                </ButtonLink>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {featuredVolunteer ? (
        <Card className="border-[color:rgba(45,138,227,0.18)] bg-[linear-gradient(180deg,rgba(45,138,227,0.06),rgba(255,255,255,1))]">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI HR toolkit</p>
                <h3 className="text-lg font-semibold text-slate-950">{featuredVolunteer.fullName}</h3>
                <p className="text-sm text-slate-500">
                  {featuredVolunteer.trustLabel} · {featuredVolunteer.trustScore}/100 trust
                </p>
              </div>
              <ButtonLink href="/organization/discover" variant="outline">
                See more candidates
              </ButtonLink>
            </div>
            <HrToolsPanel volunteerProfileId={featuredVolunteer.id} volunteerName={featuredVolunteer.fullName} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Recent submissions</h3>
            {submissions.length ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium">{submission.task.title}</p>
                    <p className="text-sm text-slate-500">By {submission.volunteerProfile.fullName}</p>
                    <p className="text-sm text-slate-600">{submission.status.toLowerCase()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No submissions yet. They will appear here as soon as volunteers start sending work back.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Shortlisted volunteers</h3>
            {shortlist.length ? (
              <div className="space-y-3">
                {shortlist.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium">{entry.volunteerProfile.fullName}</p>
                    <p className="text-sm text-slate-500">{entry.note ?? "Shortlisted for follow-up."}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.volunteerProfile.badges.map((badge) => (
                        <Badge key={badge.id}>{badge.badge.name}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No shortlisted volunteers yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Inbox</h3>
            {threads.length ? (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No message threads yet. Reach out from discovery or invite a volunteer to start the conversation.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Profile snapshot</h3>
            <p className="text-sm leading-6 text-slate-600">{user.organizationProfile.description}</p>
            <p className="text-sm text-slate-500">Industry: {user.organizationProfile.industry}</p>
            <p className="text-sm text-slate-500">Location: {user.organizationProfile.location}</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
