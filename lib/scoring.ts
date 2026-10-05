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

export function computeTrustScore(params: {
  completedTasks: number;
  averageRating: number;
  onTimeRate: number;
  averageSubmissionLagDays: number;
  averageReviewDays: number;
  badgeCount: number;
  verified: boolean;
  consistency: number;
}) {
  const completedPoints = Math.min(28, params.completedTasks * 7);
  const ratingPoints = Math.min(28, params.averageRating * 5.5);
  const onTimePoints = Math.max(0, Math.min(20, params.onTimeRate * 20));
  const submissionSpeedPoints = Math.max(0, 12 - params.averageSubmissionLagDays * 1.5);
  const reviewSpeedPoints = Math.max(0, 10 - params.averageReviewDays * 1.2);
  const badgePoints = Math.min(8, params.badgeCount * 2);
  const verifiedPoints = params.verified ? 6 : 0;
  const consistencyPoints = Math.min(8, params.consistency * 1.5);

  const score = Math.round(
    completedPoints +
      ratingPoints +
      onTimePoints +
      submissionSpeedPoints +
      reviewSpeedPoints +
      badgePoints +
      verifiedPoints +
      consistencyPoints
  );

  return Math.max(0, Math.min(100, score));
}

export function trustScoreLabel(score: number) {
  if (score >= 85) return "High trust";
  if (score >= 70) return "Trusted";
  if (score >= 50) return "Growing trust";
  return "Building trust";
}
