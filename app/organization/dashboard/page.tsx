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

  const [tasks, submissions, shortlist, threads, volunteers] = await Promise.all([
    prisma.task.findMany({
      where: { organizationId: user.organizationProfile.id },
      include: { organization: true, taskSkills: { include: { skill: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.submission.findMany({
      where: { task: { organizationId: user.organizationProfile.id } },
      include: { task: true, volunteerProfile: true, rating: true },
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
        messages: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { updatedAt: "desc" },
      take: 3
    }),
    prisma.volunteerProfile.findMany({
      where: { discoverable: true },
      include: { skills: { include: { skill: true } }, badges: { include: { badge: true } } },
      take: 3,
      orderBy: { impactScore: "desc" }
    })
  ]);

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
              <span className="rounded-full bg-[color:rgba(45,138,227,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:hsl(var(--brand-blue))]">
                Post work
              </span>
              <span className="rounded-full bg-[color:rgba(21,228,2,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgb(21,160,2)]">
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
        <StatsCard title="Threads" value={`${threads.length}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionHeading title="Posted tasks" />
          <div className="grid gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <SectionHeading title="Recommended volunteers" />
          <div className="space-y-4">
            {volunteers.map((volunteer) => (
              <Card key={volunteer.id}>
                <CardContent className="space-y-2 p-4">
                  <p className="font-medium text-slate-950">{volunteer.fullName}</p>
                  <p className="text-sm text-slate-500">{volunteer.impactScore} impact score</p>
                  <p className="text-sm text-slate-600 line-clamp-3">{volunteer.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Recent submissions</h3>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div key={submission.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium">{submission.task.title}</p>
                  <p className="text-sm text-slate-500">By {submission.volunteerProfile.fullName}</p>
                  <p className="text-sm text-slate-600">{submission.status.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Shortlisted volunteers</h3>
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
              {shortlist.length === 0 ? <p className="text-sm text-slate-500">No shortlisted volunteers yet.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Inbox</h3>
            <div className="space-y-4">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
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
