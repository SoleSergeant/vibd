import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export function ThreadCard({
  thread
}: {
  thread: {
    id: string;
    status: string;
    isInvite: boolean;
    createdAt: Date;
    volunteerProfile: { fullName: string };
    organizationProfile: { name: string };
    messages: { body: string; createdAt: Date }[];
  };
}) {
  const latest = thread.messages[thread.messages.length - 1];
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              {thread.organizationProfile.name} to {thread.volunteerProfile.fullName}
            </CardTitle>
            <p className="text-xs text-slate-500">Started {formatDate(thread.createdAt)}</p>
          </div>
          <Badge>{thread.status.toLowerCase()}</Badge>
        </div>
        <p className="text-sm leading-6 text-slate-600">{latest?.body ?? "No messages yet."}</p>
        <Link href={`/inbox/${thread.id}`} className="text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
          Open thread
        </Link>
      </CardContent>
    </Card>
  );
}
