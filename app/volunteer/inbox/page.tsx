import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { ThreadCard } from "@/components/thread-card";

export const dynamic = "force-dynamic";

export default async function VolunteerInboxPage() {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return <PageShell><p className="text-sm text-slate-600">Sign in as a volunteer to see your inbox.</p></PageShell>;
  }
  const threads = await prisma.messageThread.findMany({
    where: { volunteerProfileId: user.volunteerProfile.id },
    include: {
      volunteerProfile: true,
      organizationProfile: true,
      messages: { orderBy: { createdAt: "asc" } }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <PageShell className="space-y-8">
      <SectionHeading eyebrow="Inbox" title="Message requests and active threads" />
      <div className="space-y-4">
        {threads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </div>
    </PageShell>
  );
}
