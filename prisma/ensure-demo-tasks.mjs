import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureSkill(name, category) {
  const slug = name.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return prisma.skill.upsert({
    where: { slug },
    create: { name, slug, category },
    update: { name, category }
  });
}

async function ensureTask(title, createData) {
  const existing = await prisma.task.findFirst({ where: { title } });
  if (existing) return existing;
  return prisma.task.create({ data: createData });
}

async function main() {
  const citykind = await prisma.organizationProfile.findFirst({ where: { name: "CityKind Collective" } });
  const northstar = await prisma.organizationProfile.findFirst({ where: { name: "Northstar Studio" } });

  if (!citykind || !northstar) {
    throw new Error("Expected demo organizations were not found.");
  }

  const skills = {
    ops: await ensureSkill("Project Coordination", "Operations"),
    research: await ensureSkill("Community Research", "Research"),
    content: await ensureSkill("Content Writing", "Marketing"),
    data: await ensureSkill("Data Analysis", "Analytics"),
    design: await ensureSkill("Product Design", "Design")
  };

  await ensureTask("Volunteer onboarding mini-guide", {
    organizationId: citykind.id,
    title: "Volunteer onboarding mini-guide",
    description: "Create a short onboarding guide for new community volunteers, including first-week tasks, FAQ, and contact points.",
    category: "Operations",
    difficulty: "EASY",
    deadline: new Date("2026-04-08"),
    rewardType: "EXPERIENCE",
    visibility: "PUBLIC",
    status: "OPEN",
    location: "Remote",
    isRemote: true,
    taskSkills: { create: [{ skillId: skills.ops.id }, { skillId: skills.content.id }] }
  });

  await ensureTask("Neighborhood survey summary", {
    organizationId: citykind.id,
    title: "Neighborhood survey summary",
    description: "Review community feedback, cluster the answers into themes, and draft a one-page insight summary for internal use.",
    category: "Research",
    difficulty: "MEDIUM",
    deadline: new Date("2026-04-15"),
    rewardType: "INTERNSHIP",
    visibility: "PUBLIC",
    status: "OPEN",
    location: "Hybrid",
    isRemote: true,
    taskSkills: { create: [{ skillId: skills.research.id }, { skillId: skills.data.id }] }
  });

  await ensureTask("Landing page polish sprint", {
    organizationId: northstar.id,
    title: "Landing page polish sprint",
    description: "Improve the visual hierarchy and mobile responsiveness of a startup landing page. Copy and layout notes already available.",
    category: "Design",
    difficulty: "HARD",
    deadline: new Date("2026-04-10"),
    rewardType: "HIRING",
    visibility: "PUBLIC",
    status: "OPEN",
    location: "Remote",
    isRemote: true,
    taskSkills: { create: [{ skillId: skills.design.id }, { skillId: skills.content.id }] }
  });

  await ensureTask("Volunteer welcome checklist", {
    organizationId: citykind.id,
    title: "Volunteer welcome checklist",
    description: "Create a concise welcome checklist for incoming volunteers, with first-week steps, contacts, and onboarding expectations.",
    category: "Operations",
    difficulty: "EASY",
    deadline: new Date("2026-04-20"),
    rewardType: "EXPERIENCE",
    visibility: "PUBLIC",
    status: "OPEN",
    location: "Remote",
    isRemote: true,
    taskSkills: { create: [{ skillId: skills.ops.id }, { skillId: skills.content.id }] }
  });

  await ensureTask("Community program FAQ", {
    organizationId: citykind.id,
    title: "Community program FAQ",
    description: "Turn rough notes about a new community program into a clear FAQ with answers for volunteers and participants.",
    category: "Content",
    difficulty: "MEDIUM",
    deadline: new Date("2026-04-22"),
    rewardType: "EXPERIENCE",
    visibility: "PUBLIC",
    status: "OPEN",
    location: "Remote",
    isRemote: true,
    taskSkills: { create: [{ skillId: skills.content.id }, { skillId: skills.research.id }] }
  });

  await ensureTask("Launch coordination brief", {
    organizationId: northstar.id,
    title: "Launch coordination brief",
    description: "Prepare an internal launch coordination brief with milestones, responsibilities, and a simple status table.",
    category: "Operations",
    difficulty: "MEDIUM",
    deadline: new Date("2026-04-24"),
    rewardType: "INTERNSHIP",
    visibility: "PUBLIC",
    status: "OPEN",
    location: "Hybrid",
    isRemote: true,
    taskSkills: { create: [{ skillId: skills.ops.id }, { skillId: skills.content.id }] }
  });

  console.log("Demo tasks ensured.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
