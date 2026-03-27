import { PrismaClient, TaskDifficulty } from "@prisma/client";
import { computeImpactScore, difficultyToScore } from "@/lib/scoring";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function difficultyWeight(difficulty: TaskDifficulty) {
  return difficultyToScore(difficulty);
}

export async function refreshVolunteerRankings(prisma: PrismaClient) {
  await prisma.leaderboardEntry.deleteMany();
  const volunteers = await prisma.volunteerProfile.findMany({
    include: {
      badges: true,
      portfolioItems: {
        include: { task: true, submission: { include: { rating: true } } }
      },
      skills: { include: { skill: true } }
    }
  });

  const overallScores = volunteers.map((volunteer) => {
    const completedTasks = volunteer.portfolioItems.length;
    const difficultyScores = volunteer.portfolioItems.map((item) => difficultyWeight(item.task.difficulty));
    const averageRating = average(
      volunteer.portfolioItems
        .map((item) => item.submission.rating)
        .filter(Boolean)
        .map((rating) => ((rating!.quality + rating!.communication + rating!.speed) / 3))
    ) / 5;
    const consistency = Math.min(5, completedTasks);
    const score = computeImpactScore({
      completedTasks,
      difficultyScores,
      averageRating,
      consistency,
      badgeCount: volunteer.badges.length
    });
    return { volunteer, score };
  });

  const rankedOverall = [...overallScores].sort((a, b) => b.score - a.score);
  for (let index = 0; index < rankedOverall.length; index += 1) {
    const item = rankedOverall[index];
    await prisma.volunteerProfile.update({
      where: { id: item.volunteer.id },
      data: {
        impactScore: item.score,
        ranking: index + 1
      }
    });
    await prisma.leaderboardEntry.upsert({
      where: {
        volunteerProfileId_scope_period_label: {
          volunteerProfileId: item.volunteer.id,
          scope: "OVERALL",
          period: "ALL_TIME",
          label: "Overall"
        }
      },
      create: {
        volunteerProfileId: item.volunteer.id,
        scope: "OVERALL",
        period: "ALL_TIME",
        label: "Overall",
        score: item.score,
        rank: index + 1
      },
      update: {
        score: item.score,
        rank: index + 1
      }
    });
  }

  const skillBuckets = new Map<string, { volunteerId: string; score: number }[]>();
  const categoryBuckets = new Map<string, Map<string, number>>();

  for (const item of overallScores) {
    for (const skill of item.volunteer.skills) {
      const list = skillBuckets.get(skill.skill.name) ?? [];
      list.push({ volunteerId: item.volunteer.id, score: item.score + skill.proficiency * 10 });
      skillBuckets.set(skill.skill.name, list);
    }
    for (const portfolioItem of item.volunteer.portfolioItems) {
      const label = portfolioItem.task.category;
      const volunteerScores = categoryBuckets.get(label) ?? new Map<string, number>();
      const current = volunteerScores.get(item.volunteer.id) ?? 0;
      volunteerScores.set(item.volunteer.id, current + difficultyWeight(portfolioItem.task.difficulty));
      categoryBuckets.set(label, volunteerScores);
    }
  }

  for (const [label, list] of skillBuckets) {
    const ranked = [...list].sort((a, b) => b.score - a.score);
    for (let index = 0; index < ranked.length; index += 1) {
      const entry = ranked[index];
      await prisma.leaderboardEntry.upsert({
        where: {
          volunteerProfileId_scope_period_label: {
            volunteerProfileId: entry.volunteerId,
            scope: "SKILL",
            period: "ALL_TIME",
            label
          }
        },
        create: {
          volunteerProfileId: entry.volunteerId,
          scope: "SKILL",
          period: "ALL_TIME",
          label,
          score: entry.score,
          rank: index + 1
        },
        update: {
          score: entry.score,
          rank: index + 1
        }
      });
    }
  }

  for (const [label, scores] of categoryBuckets) {
    const ranked = [...scores.entries()]
      .map(([volunteerId, bonus]) => ({
        volunteerId,
        score: overallScores.find((entry) => entry.volunteer.id === volunteerId)!.score + bonus
      }))
      .sort((a, b) => b.score - a.score);
    for (let index = 0; index < ranked.length; index += 1) {
      const entry = ranked[index];
      await prisma.leaderboardEntry.upsert({
        where: {
          volunteerProfileId_scope_period_label: {
            volunteerProfileId: entry.volunteerId,
            scope: "CATEGORY",
            period: "ALL_TIME",
            label
          }
        },
        create: {
          volunteerProfileId: entry.volunteerId,
          scope: "CATEGORY",
          period: "ALL_TIME",
          label,
          score: entry.score,
          rank: index + 1
        },
        update: {
          score: entry.score,
          rank: index + 1
        }
      });
    }
  }
}
