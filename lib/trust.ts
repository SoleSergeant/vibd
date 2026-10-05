import type { Prisma } from "@prisma/client";
import { computeTrustScore, trustScoreLabel } from "@/lib/scoring";

/** Just the submission columns trust scoring needs; never load summaries or attachments for this. */
export const trustSubmissionSelect = {
  status: true,
  createdAt: true,
  reviewedAt: true,
  task: { select: { deadline: true, createdAt: true } },
  rating: { select: { quality: true, communication: true, speed: true } }
} satisfies Prisma.SubmissionSelect;

export type TrustSubmission = Prisma.SubmissionGetPayload<{ select: typeof trustSubmissionSelect }>;

const DAY_MS = 1000 * 60 * 60 * 24;

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function summarizeSubmissions(submissions: TrustSubmission[]) {
  const ratings = submissions
    .map((submission) => submission.rating)
    .filter((rating): rating is NonNullable<typeof rating> => Boolean(rating))
    .map((rating) => (rating.quality + rating.communication + rating.speed) / 3);
  const onTime = submissions.filter((submission) => submission.createdAt <= submission.task.deadline).length;
  const lagDays = submissions
    .map((submission) => (submission.createdAt.getTime() - submission.task.createdAt.getTime()) / DAY_MS)
    .filter((value) => Number.isFinite(value) && value >= 0);
  const reviewDays = submissions
    .map((submission) => (submission.reviewedAt ? (submission.reviewedAt.getTime() - submission.createdAt.getTime()) / DAY_MS : NaN))
    .filter((value) => Number.isFinite(value) && value >= 0);

  return {
    acceptedTasks: submissions.filter((submission) => submission.status === "ACCEPTED").length,
    averageRating: average(ratings),
    onTimeRate: submissions.length ? onTime / submissions.length : 0,
    averageSubmissionLagDays: average(lagDays),
    averageReviewDays: average(reviewDays)
  };
}

export function volunteerTrust(input: {
  completedTasks: number;
  badgeCount: number;
  verified: boolean;
  submissions: TrustSubmission[];
}) {
  const stats = summarizeSubmissions(input.submissions);
  const trustScore = computeTrustScore({
    completedTasks: input.completedTasks,
    averageRating: stats.averageRating,
    onTimeRate: stats.onTimeRate,
    averageSubmissionLagDays: stats.averageSubmissionLagDays,
    averageReviewDays: stats.averageReviewDays,
    badgeCount: input.badgeCount,
    verified: input.verified,
    consistency: Math.min(5, input.completedTasks + stats.acceptedTasks)
  });
  return { ...stats, trustScore, trustLabel: trustScoreLabel(trustScore) };
}
