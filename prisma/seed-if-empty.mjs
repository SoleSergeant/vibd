// Runs during the Vercel build (see "vercel-build" in package.json).
// Seeds demo data only into a brand-new, empty database. prisma/seed.ts wipes every table,
// so it must never run against a database that already has users.
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const users = await prisma.user.count();
  if (users > 0) {
    console.log(`Database already has ${users} users; skipping demo seed.`);
  } else {
    console.log("Empty database detected; seeding demo data.");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    execSync("node prisma/seed-runner.mjs", { stdio: "inherit" });
  }
} finally {
  await prisma.$disconnect();
}
