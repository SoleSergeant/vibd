import { Prisma, PrismaClient, TaskDifficulty } from "@prisma/client";
import { computeImpactScore, difficultyToScore } from "@/lib/scoring";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

type LeaderboardRow = Prisma.LeaderboardEntryCreateManyInput;

function rankRows(
  scores: { volunteerId: string; score: number }[],
  scope: "OVERALL" | "SKILL" | "CATEGORY",
  label: string,
  skillId: string | null = null
): LeaderboardRow[] {
  return [...scores]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      volunteerProfileId: entry.volunteerId,
      skillId,
      scope,
      period: "ALL_TIME",
      label,
      score: entry.score,
      rank: index + 1
    }));
}

/**
 * Recomputes impact scores, ranks, and every leaderboard. Reads only the columns it needs
 * (never submission bodies or attachments) and writes everything in one transaction.
 */
export async function refreshVolunteerRankings(prisma: PrismaClient) {
  const volunteers = await prisma.volunteerProfile.findMany({
    select: {
      id: true,
      impactScore: true,
      ranking: true,
      _count: { select: { badges: true } },
      skills: { select: { proficiency: true, skill: { select: { id: true, name: true } } } },
      portfolioItems: {
        select: {
          task: { select: { difficulty: true, category: true } },
          submission: { select: { rating: { select: { quality: true, communication: true, speed: true } } } }
        }
      }
    }
  });

  const overall = volunteers.map((volunteer) => {
    const completedTasks = volunteer.portfolioItems.length;
    const ratings = volunteer.portfolioItems
      .map((item) => item.submission.rating)
      .filter((rating): rating is NonNullable<typeof rating> => Boolean(rating))
      .map((rating) => (rating.quality + rating.communication + rating.speed) / 3);
    const score = computeImpactScore({
      completedTasks,
      difficultyScores: volunteer.portfolioItems.map((item) => difficultyToScore(item.task.difficulty as TaskDifficulty)),
      averageRating: average(ratings) / 5,
      consistency: Math.min(5, completedTasks),
      badgeCount: volunteer._count.badges
    });
    return { volunteer, volunteerId: volunteer.id, score };
  });
  const scoreById = new Map(overall.map((entry) => [entry.volunteerId, entry.score]));

  const rows: LeaderboardRow[] = rankRows(overall, "OVERALL", "Overall");

  const skillBuckets = new Map<string, { skillId: string; scores: { volunteerId: string; score: number }[] }>();
  const categoryBuckets = new Map<string, Map<string, number>>();
  for (const { volunteer, score } of overall) {
    for (const entry of volunteer.skills) {
      const bucket = skillBuckets.get(entry.skill.name) ?? { skillId: entry.skill.id, scores: [] };
      bucket.scores.push({ volunteerId: volunteer.id, score: score + entry.proficiency * 10 });
      skillBuckets.set(entry.skill.name, bucket);
    }
    for (const item of volunteer.portfolioItems) {
      const bonuses = categoryBuckets.get(item.task.category) ?? new Map<string, number>();
      bonuses.set(volunteer.id, (bonuses.get(volunteer.id) ?? 0) + difficultyToScore(item.task.difficulty as TaskDifficulty));
      categoryBuckets.set(item.task.category, bonuses);
    }
  }
  for (const [label, bucket] of skillBuckets) {
    rows.push(...rankRows(bucket.scores, "SKILL", label, bucket.skillId));
  }
  for (const [label, bonuses] of categoryBuckets) {
    const scores = [...bonuses].map(([volunteerId, bonus]) => ({ volunteerId, score: scoreById.get(volunteerId)! + bonus }));
    rows.push(...rankRows(scores, "CATEGORY", label));
  }

  // Only touch profiles whose score or rank actually changed.
  const rankById = new Map(rows.filter((row) => row.scope === "OVERALL").map((row) => [row.volunteerProfileId, row.rank]));
  const changed = overall.filter(
    ({ volunteer, score }) => volunteer.impactScore !== score || volunteer.ranking !== rankById.get(volunteer.id)
  );

  const writes: Prisma.PrismaPromise<unknown>[] = [prisma.leaderboardEntry.deleteMany(), prisma.leaderboardEntry.createMany({ data: rows })];
  if (changed.length) {
    const values = Prisma.join(
      changed.map(({ volunteer, score }) => Prisma.sql`(${volunteer.id}, ${score}::int, ${rankById.get(volunteer.id)!}::int)`)
    );
    writes.push(prisma.$executeRaw`
      UPDATE "VolunteerProfile" AS v
      SET "impactScore" = data.score, "ranking" = data.rank, "updatedAt" = NOW()
      FROM (VALUES ${values}) AS data(id, score, rank)
      WHERE v.id = data.id
    `);
  }

  await prisma.$transaction(writes);
}
