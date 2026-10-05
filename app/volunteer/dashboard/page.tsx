import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { StatsCard } from "@/components/stats-card";
import { ThreadCard } from "@/components/thread-card";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { recommendTasks } from "@/lib/ai";
import { trustSubmissionSelect, volunteerTrust } from "@/lib/trust";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VolunteerDashboardPage() {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return (
      <PageShell>
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Sign in as a volunteer to access this dashboard.</CardContent>
        </Card>
      </PageShell>
    );
  }

  const [openTasks, applications, submissions, threads] = await Promise.all([
    prisma.task.findMany({
      where: { visibility: "PUBLIC", status: "OPEN" },
      include: { organization: true, taskSkills: { include: { skill: true } } },
      take: 12,
      orderBy: { createdAt: "desc" }
    }),
    prisma.taskApplication.findMany({
      where: { volunteerProfileId: user.volunteerProfile.id },
      include: { task: { include: { organization: true, taskSkills: { include: { skill: true } } } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.submission.findMany({
      where: { volunteerProfileId: user.volunteerProfile.id },
      select: {
        ...trustSubmissionSelect,
        id: true,
        task: { select: { title: true, deadline: true, createdAt: true, organization: { select: { name: true } } } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.messageThread.findMany({
      where: { volunteerProfileId: user.volunteerProfile.id },
      include: {
        volunteerProfile: true,
        organizationProfile: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" },
      take: 3
    })
  ]);

  // Same definition of "completed" (accepted portfolio work) that organizations see in discovery.
  const trustStats = volunteerTrust({
    completedTasks: user.volunteerProfile.portfolioItems.length,
    badgeCount: user.volunteerProfile.badges.length,
    verified: user.volunteerProfile.verified,
    submissions
  });

  const recommendations = await recommendTasks({
    volunteer: user.volunteerProfile,
    tasks: openTasks,
    trustScore: trustStats.trustScore
  });
  const taskById = new Map(openTasks.map((task) => [task.id, task]));

  const activeTasks = applications.filter((application) => application.status === "SHORTLISTED").map((application) => application.task);
  const acceptedSubmissions = submissions.filter((submission) => submission.status === "ACCEPTED");
  const hasRecommendations = recommendations.length > 0;

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Volunteer dashboard"
        title={`Welcome back, ${user.volunteerProfile.fullName}.`}
        description="Track your applications, submissions, portfolio growth, inbox conversations, and impact score in one place."
      />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/volunteer/profile">Edit profile</ButtonLink>
        <ButtonLink href="/volunteer/cv" variant="secondary">
          AI impact CV
        </ButtonLink>
        <ButtonLink href="/volunteer/portfolio" variant="outline">
          Portfolio
        </ButtonLink>
        <ButtonLink href="/volunteer/inbox" variant="secondary">
          Inbox
        </ButtonLink>
        <ButtonLink href="/discover" variant="outline">
          Explore workboard
        </ButtonLink>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Impact score" value={`${user.volunteerProfile.impactScore}`} />
        <StatsCard title="Trust score" value={`${trustStats.trustScore}`} />
        <StatsCard title="Rank" value={user.volunteerProfile.ranking ? `#${user.volunteerProfile.ranking}` : "unranked"} />
        <StatsCard title="Applications" value={`${applications.length}`} />
        <StatsCard title="Submissions" value={`${submissions.length}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionHeading
            title="Smart recommendations"
            description="AI ranks open work based on your profile, skills, interests, trust score, and the tasks organizations are posting."
          />
          <div className="grid gap-4">
            {hasRecommendations ? (
              recommendations.map((recommendation) => {
                const task = taskById.get(recommendation.taskId);
                if (!task) return null;
                return (
                  <Card key={recommendation.taskId} className="hover:shadow-soft">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">{task.title}</h3>
                          <p className="text-sm text-slate-500">By {task.organization.name}</p>
                        </div>
                        <Badge>AI match</Badge>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{recommendation.reason}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {task.taskSkills.map((item) => (
                          <span key={item.skill.name} className="rounded-full bg-slate-100 px-2.5 py-1">
                            {item.skill.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">
                          Deadline preview: {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(task.deadline)}
                        </p>
                        <Link href={`/tasks/${task.id}`} className="text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
                          View task
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-dashed border-slate-300 bg-slate-50">
                <CardContent className="space-y-3 p-6">
                  <p className="text-base font-semibold text-slate-950">No recommendations yet.</p>
                  <p className="text-sm leading-6 text-slate-600">
                    Fill in your profile and Vibd will surface tasks that match your skills, availability, and trust signals.
                  </p>
                  <ButtonLink href="/volunteer/profile">Improve my profile</ButtonLink>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <SectionHeading title="Inbox" description="Message requests and active threads." />
          {threads.length ? (
            <div className="space-y-4">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-300 bg-slate-50">
              <CardContent className="space-y-3 p-6">
                <p className="text-sm text-slate-600">
                  Your inbox will appear here when organizations invite you, shortlist you, or reply to your submissions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Applied tasks</h3>
            {applications.length ? (
              <div className="space-y-3">
                {applications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="font-medium text-slate-950">{application.task.title}</p>
                      <p className="text-sm text-slate-500">{application.task.organization.name}</p>
                    </div>
                    <p className="text-sm text-slate-500">{application.status.toLowerCase()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No applications yet. Start by applying to a few tasks that match your skills.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Active tasks</h3>
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-950">{task.title}</p>
                  <p className="text-sm text-slate-500">{task.organization.name}</p>
                </div>
              ))}
              {activeTasks.length === 0 ? <p className="text-sm text-slate-500">No active tasks right now.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Completed tasks</h3>
            {submissions.length ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-950">{submission.task.title}</p>
                    <p className="text-sm text-slate-500">{submission.status.toLowerCase()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Completed work will appear here once your submissions are accepted.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Accepted completions</h3>
            {acceptedSubmissions.length ? (
              <div className="space-y-3">
                {acceptedSubmissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-950">{submission.task.title}</p>
                    <p className="text-sm text-slate-500">{submission.task.organization.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No accepted completions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
