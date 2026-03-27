import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VolunteerPortfolioPage() {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return <PageShell><p className="text-sm text-slate-600">Sign in as a volunteer to see this page.</p></PageShell>;
  }

  const items = await prisma.portfolioItem.findMany({
    where: { volunteerProfileId: user.volunteerProfile.id },
    include: { task: { include: { organization: true } }, submission: true },
    orderBy: { completedAt: "desc" }
  });

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Portfolio"
        title="Verified work history"
        description="Accepted submissions become portfolio items with feedback, rating, and completion date."
      />
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-3 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{item.taskTitle}</h3>
                  <p className="text-sm text-slate-500">{item.organizationName}</p>
                </div>
                <Badge>{item.rating}/5</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">{item.summary}</p>
              <p className="text-sm text-slate-600">Feedback: {item.feedback}</p>
              {item.submission.attachmentUrl ? (
                <a
                  href={item.submission.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-[color:hsl(var(--brand-blue))]"
                >
                  Open assignment file
                </a>
              ) : null}
              <p className="text-xs text-slate-500">Completed {formatDate(item.completedAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
