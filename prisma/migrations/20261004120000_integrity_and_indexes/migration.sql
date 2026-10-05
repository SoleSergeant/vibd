-- ImpactCv existed in schema.prisma but was never in a migration (databases set up with `db push` already have it).
CREATE TABLE IF NOT EXISTS "ImpactCv" (
    "id" TEXT NOT NULL,
    "volunteerProfileId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "topSkills" TEXT[],
    "proofPoints" TEXT[],
    "metrics" TEXT[],
    "approvalNotes" TEXT[],
    "approvedByAi" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpactCv_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ImpactCv_volunteerProfileId_key" ON "ImpactCv"("volunteerProfileId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ImpactCv_volunteerProfileId_fkey') THEN
    ALTER TABLE "ImpactCv" ADD CONSTRAINT "ImpactCv_volunteerProfileId_fkey"
      FOREIGN KEY ("volunteerProfileId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- A task can now have more than one accepted volunteer.
DROP INDEX IF EXISTS "PortfolioItem_taskId_key";
CREATE INDEX IF NOT EXISTS "PortfolioItem_taskId_idx" ON "PortfolioItem"("taskId");
CREATE INDEX IF NOT EXISTS "PortfolioItem_volunteerProfileId_completedAt_idx" ON "PortfolioItem"("volunteerProfileId", "completedAt");

-- Duplicated the unique index on the same columns.
DROP INDEX IF EXISTS "Submission_taskId_volunteerProfileId_idx";
CREATE INDEX IF NOT EXISTS "Submission_volunteerProfileId_idx" ON "Submission"("volunteerProfileId");

-- Foreign-key / query-path indexes (Postgres does not index foreign keys automatically).
CREATE INDEX IF NOT EXISTS "Task_organizationId_createdAt_idx" ON "Task"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Task_status_visibility_createdAt_idx" ON "Task"("status", "visibility", "createdAt");
CREATE INDEX IF NOT EXISTS "TaskApplication_volunteerProfileId_idx" ON "TaskApplication"("volunteerProfileId");
CREATE INDEX IF NOT EXISTS "MessageThread_organizationProfileId_idx" ON "MessageThread"("organizationProfileId");
CREATE INDEX IF NOT EXISTS "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeaderboardEntry_scope_label_rank_idx" ON "LeaderboardEntry"("scope", "label", "rank");
