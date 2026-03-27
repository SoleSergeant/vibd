import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function ThreadDetailPage({ params }: { params: { threadId: string } }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.threadId },
    include: {
      volunteerProfile: true,
      organizationProfile: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } }
    }
  });
  if (!thread) notFound();

  const canView =
    (user.role === "VOLUNTEER" && thread.volunteerProfile.userId === user.id) ||
    (user.role === "ORGANIZATION" && thread.organizationProfile.userId === user.id);
  if (!canView) notFound();

  const isVolunteer = user.role === "VOLUNTEER";
  const isPending = thread.status === "REQUESTED";

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Inbox thread"
        title={`${thread.organizationProfile.name} and ${thread.volunteerProfile.fullName}`}
        description={thread.isInvite ? "Private invitation thread" : "Message request or active conversation"}
      />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-3">
            {thread.messages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{message.sender.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{message.body}</p>
              </div>
            ))}
          </div>
          {isVolunteer && isPending ? (
            <div className="flex flex-wrap gap-3">
              <form action={`/api/threads/${thread.id}/respond`} method="post">
                <input type="hidden" name="response" value="ACCEPT" />
                <Button type="submit">Accept request</Button>
              </form>
              <form action={`/api/threads/${thread.id}/respond`} method="post">
                <input type="hidden" name="response" value="DECLINE" />
                <Button type="submit" variant="outline">
                  Decline
                </Button>
              </form>
            </div>
          ) : null}
          {thread.status === "ACTIVE" ? (
            <form action={`/api/threads/${thread.id}/messages`} method="post" className="space-y-3">
              <Textarea name="body" placeholder="Write a message" required />
              <Button type="submit">Send message</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
