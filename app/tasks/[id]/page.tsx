import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { SkillMatchCard } from "@/components/ai/skill-match-card";
import { JobChatbot } from "@/components/ai/job-chatbot";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      taskSkills: { include: { skill: true } },
      applications: { include: { volunteerProfile: true } },
      submissions: { include: { volunteerProfile: true, rating: true } }
    }
  });

  if (!task) notFound();
  const volunteerForMatch =
    currentUser?.role === "VOLUNTEER" && currentUser.volunteerProfile
      ? await prisma.volunteerProfile.findUnique({
          where: { id: currentUser.volunteerProfile.id },
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
        })
      : null;
  const orgUser = currentUser?.role === "ORGANIZATION" && currentUser.organizationProfile?.id === task.organizationId;
  const publicVisible = task.visibility === "PUBLIC";
  if (!publicVisible && !orgUser) {
    return (
      <PageShell>
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            This task is private and only visible to invited volunteers.
          </CardContent>
        </Card>
      </PageShell>
    );
  }
  const volunteerProfile = currentUser?.role === "VOLUNTEER" ? currentUser.volunteerProfile : null;
  const submitted = volunteerProfile
    ? task.submissions.find((submission) => submission.volunteerProfileId === volunteerProfile.id)
    : null;
  const applied = volunteerProfile
    ? task.applications.find((application) => application.volunteerProfileId === volunteerProfile.id)
    : null;

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow={task.category}
        title={task.title}
        description={`Posted by ${task.organization.name} • Deadline ${formatDate(task.deadline)}`}
      />
      <div className="flex flex-wrap gap-2">
        <Badge>{task.difficulty.toLowerCase()}</Badge>
        <Badge>{task.rewardType.toLowerCase()}</Badge>
        <Badge>{task.visibility.toLowerCase()}</Badge>
        {task.stipendAmount ? <Badge>${task.stipendAmount} stipend</Badge> : null}
      </div>
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-7 text-slate-700">{task.description}</p>
          <div className="flex flex-wrap gap-2">
            {task.taskSkills.map((item) => (
              <Badge key={item.skill.name} className="bg-white">
                {item.skill.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {volunteerForMatch ? (
        <SkillMatchCard
          volunteer={{
            fullName: volunteerForMatch.fullName,
            bio: volunteerForMatch.bio,
            headline: volunteerForMatch.headline,
            interests: volunteerForMatch.interests,
            availability: volunteerForMatch.availability,
            opportunityStatus: volunteerForMatch.opportunityStatus,
            impactScore: volunteerForMatch.impactScore,
            ranking: volunteerForMatch.ranking,
            verified: volunteerForMatch.verified,
            badges: volunteerForMatch.badges,
            skills: volunteerForMatch.skills,
            portfolioItems: volunteerForMatch.portfolioItems.map((item) => ({
              taskTitle: item.task.title,
              organizationName: item.task.organization.name,
              summary: item.summary,
              feedback: item.feedback,
              rating: item.rating ?? 0,
              completedAt: item.completedAt
            }))
          }}
          task={{
            title: task.title,
            description: task.description,
            category: task.category,
            difficulty: task.difficulty,
            rewardType: task.rewardType,
            visibility: task.visibility,
            organizationName: task.organization.name,
            skills: task.taskSkills.map((item) => item.skill.name)
          }}
        />
      ) : null}

      {currentUser?.role === "VOLUNTEER" && volunteerProfile ? (
        <div className="space-y-6">
          <JobChatbot
            taskId={task.id}
            taskTitle={task.title}
            organizationName={task.organization.name}
            taskSkills={task.taskSkills.map((item) => item.skill.name)}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <h3 className="text-lg font-semibold">Apply to this task</h3>
                <form action={`/api/tasks/${task.id}/apply`} method="post" className="space-y-4">
                  <Textarea name="note" placeholder="Tell the organization why you're a fit" />
                  <Button type="submit" className="w-full">
                    {applied ? "Update application" : "Apply"}
                  </Button>
                </form>
                {applied ? <p className="text-sm text-slate-500">Current status: {applied.status.toLowerCase()}</p> : null}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-6">
                <h3 className="text-lg font-semibold">Submit work</h3>
                <form action={`/api/tasks/${task.id}/submit`} method="post" encType="multipart/form-data" className="space-y-4">
                  <Textarea name="textSummary" placeholder="Summarize your work" required />
                  <Input name="attachmentUrl" placeholder="Link to your file, if you have one" />
                  <Input name="assignmentFile" type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
                  <Button type="submit" className="w-full">
                    {submitted ? "Update submission" : "Submit work"}
                  </Button>
                </form>
                {submitted ? <p className="text-sm text-slate-500">Current status: {submitted.status.toLowerCase()}</p> : null}
                {submitted?.attachmentUrl ? (
                  <a href={submitted.attachmentUrl} className="text-sm font-medium text-[color:hsl(var(--brand-blue))]" target="_blank" rel="noreferrer">
                    Open uploaded assignment
                  </a>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {orgUser ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Organization review snapshot</h3>
            <p className="text-sm text-slate-600">Applications and submissions are shown on the review dashboard for faster review cycles.</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/organization/tasks/${task.id}/edit`} variant="outline">
                Edit task
              </ButtonLink>
              <ButtonLink href="/organization/submissions" variant="secondary">
                Review submissions
              </ButtonLink>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
