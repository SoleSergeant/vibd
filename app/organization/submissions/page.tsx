import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return <PageShell><p className="text-sm text-slate-600">Sign in as an organization to review submissions.</p></PageShell>;
  }

  const submissions = await prisma.submission.findMany({
    where: { task: { organizationId: user.organizationProfile.id } },
    include: { task: true, volunteerProfile: true, rating: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Submission review"
        title="Review, accept, reject, and rate work."
        description="Accepted submissions automatically become portfolio proof for the volunteer."
      />
      <div className="space-y-4">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{submission.task.title}</h3>
                  <p className="text-sm text-slate-500">From {submission.volunteerProfile.fullName}</p>
                </div>
                <p className="text-sm text-slate-500">{submission.status.toLowerCase()}</p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{submission.textSummary}</p>
              {submission.attachmentUrl ? (
                <a
                  href={submission.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-[color:hsl(var(--brand-blue))]"
                >
                  View uploaded assignment
                </a>
              ) : null}
              <p className="text-xs text-slate-500">Submitted {formatDate(submission.createdAt)}</p>
              <form action={`/api/submissions/${submission.id}/review`} method="post" className="grid gap-3 md:grid-cols-4">
                <Input name="quality" type="number" min="1" max="5" placeholder="Quality" />
                <Input name="communication" type="number" min="1" max="5" placeholder="Communication" />
                <Input name="speed" type="number" min="1" max="5" placeholder="Speed" />
                <Select name="status" defaultValue={submission.status}>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="NEEDS_REVISION">Needs revision</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
                <Textarea name="feedback" placeholder="Feedback" className="md:col-span-4" />
                <Button type="submit" className="md:col-span-4">
                  Save review
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
