-- @@unique([taskId, volunteerProfileId]) was in schema.prisma but never in a migration
-- (databases created with `db push` already have it). Submissions upsert on this key.
CREATE UNIQUE INDEX IF NOT EXISTS "Submission_taskId_volunteerProfileId_key" ON "Submission"("taskId", "volunteerProfileId");
