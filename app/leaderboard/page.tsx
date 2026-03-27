import { prisma } from "@/lib/db";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams?: { scope?: string };
}) {
  const scope = searchParams?.scope === "skill" ? "SKILL" : searchParams?.scope === "category" ? "CATEGORY" : "OVERALL";
  const entries = await prisma.leaderboardEntry.findMany({
    where: { scope, period: "ALL_TIME" },
    include: { volunteerProfile: true, skill: true },
    orderBy: { rank: "asc" },
    take: 20
  });

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Leaderboards"
        title="Ranked by verified impact."
        description="A simple MVP leaderboard based on completed work, ratings, consistency, and badge activity."
      />
      <div className="flex flex-wrap gap-2">
        <a href="/leaderboard" className={`rounded-full px-4 py-2 text-sm ${scope === "OVERALL" ? "bg-slate-950 text-white" : "bg-white"}`}>
          Overall
        </a>
        <a href="/leaderboard?scope=skill" className={`rounded-full px-4 py-2 text-sm ${scope === "SKILL" ? "bg-slate-950 text-white" : "bg-white"}`}>
          Skill
        </a>
        <a href="/leaderboard?scope=category" className={`rounded-full px-4 py-2 text-sm ${scope === "CATEGORY" ? "bg-slate-950 text-white" : "bg-white"}`}>
          Category
        </a>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Rank</TableHeadCell>
              <TableHeadCell>Volunteer</TableHeadCell>
              <TableHeadCell>Label</TableHeadCell>
              <TableHeadCell>Score</TableHeadCell>
              <TableHeadCell>Updated</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Badge>#{entry.rank}</Badge>
                </TableCell>
                <TableCell>{entry.volunteerProfile.fullName}</TableCell>
                <TableCell>{entry.label}</TableCell>
                <TableCell>{entry.score.toFixed(0)}</TableCell>
                <TableCell>{formatDate(entry.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}
