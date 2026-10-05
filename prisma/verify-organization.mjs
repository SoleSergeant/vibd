// Usage: npm run org:verify -- hello@citykind.org        (verify)
//        npm run org:verify -- hello@citykind.org --revoke
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();
const verified = !args.includes("--revoke");

if (!email) {
  console.error("Usage: npm run org:verify -- <organization account email> [--revoke]");
  process.exit(1);
}

try {
  const user = await prisma.user.findUnique({ where: { email }, include: { organizationProfile: true } });
  if (!user?.organizationProfile) {
    console.error(`No organization account found for ${email}.`);
    process.exitCode = 1;
  } else {
    await prisma.organizationProfile.update({ where: { id: user.organizationProfile.id }, data: { verified } });
    console.log(`${user.organizationProfile.name} (${email}) is now ${verified ? "verified" : "unverified"}.`);
  }
} finally {
  await prisma.$disconnect();
}
