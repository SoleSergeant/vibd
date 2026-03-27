import { TaskDifficulty } from "@prisma/client";

const difficultyWeights: Record<TaskDifficulty, number> = {
  EASY: 6,
  MEDIUM: 10,
  HARD: 16,
  EXPERT: 22
};

export function computeImpactScore(params: {
  completedTasks: number;
  difficultyScores: number[];
  averageRating: number;
  consistency: number;
  badgeCount: number;
}) {
  const taskPoints = params.completedTasks * 12;
  const difficultyPoints = params.difficultyScores.reduce((sum, score) => sum + score, 0);
  const ratingPoints = params.averageRating * 18;
  const consistencyPoints = params.consistency * 8;
  const badgePoints = params.badgeCount * 5;
  return Math.round(taskPoints + difficultyPoints + ratingPoints + consistencyPoints + badgePoints);
}

export function difficultyToScore(difficulty: TaskDifficulty) {
  return difficultyWeights[difficulty];
}
