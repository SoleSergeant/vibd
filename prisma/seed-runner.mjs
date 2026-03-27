import crypto from "crypto";
import { Prisma, PrismaClient, TaskDifficulty } from "@prisma/client";

const prisma = new PrismaClient();
const PASSWORD_ITERATIONS = 120000;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function difficultyWeight(difficulty) {
  return {
    EASY: 6,
    MEDIUM: 10,
    HARD: 16,
    EXPERT: 22
  }[difficulty] ?? 0;
}

function computeImpactScore(params) {
  const taskPoints = params.completedTasks * 12;
  const difficultyPoints = params.difficultyScores.reduce((sum, score) => sum + score, 0);
  const ratingPoints = params.averageRating * 18;
  const consistencyPoints = params.consistency * 8;
  const badgePoints = params.badgeCount * 5;
  return Math.round(taskPoints + difficultyPoints + ratingPoints + consistencyPoints + badgePoints);
}

function textArraySql(values) {
  if (!values.length) {
    return Prisma.sql`ARRAY[]::text[]`;
  }
  return Prisma.sql`ARRAY[${Prisma.join(values.map((value) => Prisma.sql`${value}`))}]::text[]`;
}

async function refreshVolunteerRankings() {
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
    const averageRating =
      average(
        volunteer.portfolioItems
          .map((item) => item.submission.rating)
          .filter(Boolean)
          .map((rating) => (rating.quality + rating.communication + rating.speed) / 3)
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

  const skillBuckets = new Map();
  const categoryBuckets = new Map();

  for (const item of overallScores) {
    for (const skill of item.volunteer.skills) {
      const list = skillBuckets.get(skill.skill.name) ?? [];
      list.push({ volunteerId: item.volunteer.id, score: item.score + skill.proficiency * 10 });
      skillBuckets.set(skill.skill.name, list);
    }
    for (const portfolioItem of item.volunteer.portfolioItems) {
      const label = portfolioItem.task.category;
      const volunteerScores = categoryBuckets.get(label) ?? new Map();
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
        score: overallScores.find((entry) => entry.volunteer.id === volunteerId).score + bonus
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

async function ensureSkill(name, category) {
  const slug = name.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return prisma.skill.upsert({
    where: { slug },
    create: { name, slug, category },
    update: { name, category }
  });
}

async function main() {
  const [citykind, northstar, onboardingTask, surveyTask, landingTask, aminaChecklistTask, aminaFaqTask, aminaBriefTask] = await Promise.all([
    prisma.organizationProfile.findFirst({ where: { name: "CityKind Collective" } }),
    prisma.organizationProfile.findFirst({ where: { name: "Northstar Studio" } }),
    prisma.task.findFirst({ where: { title: "Volunteer onboarding mini-guide" } }),
    prisma.task.findFirst({ where: { title: "Neighborhood survey summary" } }),
    prisma.task.findFirst({ where: { title: "Landing page polish sprint" } }),
    prisma.task.findFirst({ where: { title: "Volunteer welcome checklist" } }),
    prisma.task.findFirst({ where: { title: "Community program FAQ" } }),
    prisma.task.findFirst({ where: { title: "Launch coordination brief" } })
  ]);

  if (!citykind || !northstar || !onboardingTask || !surveyTask || !landingTask || !aminaChecklistTask || !aminaFaqTask || !aminaBriefTask) {
    throw new Error("Expected demo tasks and organizations were not found. Run the main seed first.");
  }

  const aminaUser = await prisma.user.upsert({
    where: { email: "amina@vibedwork.dev" },
    create: {
      email: "amina@vibedwork.dev",
      name: "Amina Karimova",
      role: "VOLUNTEER",
      passwordHash: hashPassword("password123"),
      volunteerProfile: {
        create: {
          fullName: "Amina Karimova",
          bio: "Early-career community builder with a strong bias for delivery, documentation, and making teams look organized.",
          headline: "Operations-minded volunteer with real project proof.",
          interests: ["community programs", "social impact", "operations"],
          languages: ["English", "Uzbek", "Russian"],
          availability: "Evenings and weekends",
          opportunityStatus: "OPEN_PAID_WORK",
          discoverable: true,
          verified: true,
          verifiedAt: new Date("2025-12-12"),
          location: "Tashkent, Uzbekistan"
        }
      }
    },
    update: {
      name: "Amina Karimova",
      volunteerProfile: {
        upsert: {
          create: {
            fullName: "Amina Karimova",
            bio: "Early-career community builder with a strong bias for delivery, documentation, and making teams look organized.",
            headline: "Operations-minded volunteer with real project proof.",
            interests: ["community programs", "social impact", "operations"],
            languages: ["English", "Uzbek", "Russian"],
            availability: "Evenings and weekends",
            opportunityStatus: "OPEN_PAID_WORK",
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-12-12"),
            location: "Tashkent, Uzbekistan"
          },
          update: {
            fullName: "Amina Karimova",
            bio: "Early-career community builder with a strong bias for delivery, documentation, and making teams look organized.",
            headline: "Operations-minded volunteer with real project proof.",
            interests: ["community programs", "social impact", "operations"],
            languages: ["English", "Uzbek", "Russian"],
            availability: "Evenings and weekends",
            opportunityStatus: "OPEN_PAID_WORK",
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-12-12"),
            location: "Tashkent, Uzbekistan"
          }
        }
      }
    },
    include: { volunteerProfile: true }
  });

  const mayaUser = await prisma.user.upsert({
    where: { email: "maya@vibedwork.dev" },
    create: {
      email: "maya@vibedwork.dev",
      name: "Maya Rahmonova",
      role: "VOLUNTEER",
      passwordHash: hashPassword("password123"),
      volunteerProfile: {
        create: {
          fullName: "Maya Rahmonova",
          bio: "High-performing volunteer with verified delivery across operations, research, and content. Strong track record of completing real tasks with excellent feedback.",
          headline: "Power volunteer with a strong verified work history.",
          interests: ["operations", "research", "content", "community"],
          languages: ["English", "Uzbek", "Russian"],
          availability: "12-15 hours/week, evenings and weekends",
          opportunityStatus: "OPEN_PAID_WORK",
          discoverable: true,
          verified: true,
          verifiedAt: new Date("2025-08-12"),
          location: "Tashkent, Uzbekistan"
        }
      }
    },
    update: {
      name: "Maya Rahmonova",
      volunteerProfile: {
        upsert: {
          create: {
            fullName: "Maya Rahmonova",
            bio: "High-performing volunteer with verified delivery across operations, research, and content. Strong track record of completing real tasks with excellent feedback.",
            headline: "Power volunteer with a strong verified work history.",
            interests: ["operations", "research", "content", "community"],
            languages: ["English", "Uzbek", "Russian"],
            availability: "12-15 hours/week, evenings and weekends",
            opportunityStatus: "OPEN_PAID_WORK",
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-08-12"),
            location: "Tashkent, Uzbekistan"
          },
          update: {
            fullName: "Maya Rahmonova",
            bio: "High-performing volunteer with verified delivery across operations, research, and content. Strong track record of completing real tasks with excellent feedback.",
            headline: "Power volunteer with a strong verified work history.",
            interests: ["operations", "research", "content", "community"],
            languages: ["English", "Uzbek", "Russian"],
            availability: "12-15 hours/week, evenings and weekends",
            opportunityStatus: "OPEN_PAID_WORK",
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-08-12"),
            location: "Tashkent, Uzbekistan"
          }
        }
      }
    },
    include: { volunteerProfile: true }
  });

  const amina = aminaUser.volunteerProfile;
  const maya = mayaUser.volunteerProfile;
  const skills = {
    ops: await ensureSkill("Project Coordination", "Operations"),
    research: await ensureSkill("Community Research", "Research"),
    content: await ensureSkill("Content Writing", "Marketing"),
    data: await ensureSkill("Data Analysis", "Analytics")
  };

  for (const [skillId, proficiency] of [
    [skills.ops.id, 5],
    [skills.content.id, 4],
    [skills.research.id, 4]
  ]) {
    await prisma.volunteerSkill.upsert({
      where: {
        volunteerProfileId_skillId: {
          volunteerProfileId: amina.id,
          skillId
        }
      },
      create: {
        volunteerProfileId: amina.id,
        skillId,
        proficiency
      },
      update: {
        proficiency
      }
    });
  }

  for (const [skillId, proficiency] of [
    [skills.ops.id, 5],
    [skills.research.id, 5],
    [skills.content.id, 5],
    [skills.data.id, 4]
  ]) {
    await prisma.volunteerSkill.upsert({
      where: {
        volunteerProfileId_skillId: {
          volunteerProfileId: maya.id,
          skillId
        }
      },
      create: {
        volunteerProfileId: maya.id,
        skillId,
        proficiency
      },
      update: {
        proficiency
      }
    });
  }

  const acceptanceData = [
    {
      volunteer: amina,
      task: aminaChecklistTask,
      summary: "Built a volunteer welcome checklist with first-week steps, contact points, and onboarding expectations.",
      attachmentUrl: "https://files.example.com/amina-welcome-checklist.pdf",
      rating: { quality: 5, communication: 5, speed: 5, feedback: "Extremely practical and immediately usable." },
      completedAt: new Date("2026-03-12")
    },
    {
      volunteer: amina,
      task: aminaFaqTask,
      summary: "Turned rough community notes into a clear FAQ covering schedule, access, and who to contact for help.",
      attachmentUrl: "https://files.example.com/amina-program-faq.docx",
      rating: { quality: 5, communication: 4, speed: 5, feedback: "Clear, organized, and helpful for the team." },
      completedAt: new Date("2026-03-15")
    },
    {
      volunteer: amina,
      task: aminaBriefTask,
      summary: "Prepared a launch coordination brief with milestones, responsibilities, and a simple status table for the team.",
      attachmentUrl: "https://files.example.com/amina-launch-brief.pdf",
      rating: { quality: 4, communication: 5, speed: 4, feedback: "Strong structure and dependable delivery." },
      completedAt: new Date("2026-03-18")
    },
    {
      volunteer: maya,
      task: onboardingTask,
      summary: "Built a polished onboarding guide with a clear first-week checklist, support contacts, and role expectations.",
      attachmentUrl: "https://files.example.com/maya-onboarding.pdf",
      rating: { quality: 5, communication: 5, speed: 5, feedback: "Excellent polish and immediate usefulness." },
      completedAt: new Date("2026-03-20")
    },
    {
      volunteer: maya,
      task: surveyTask,
      summary: "Turned raw community feedback into themes, a summary table, and action-ready recommendations.",
      attachmentUrl: "https://files.example.com/maya-survey.pdf",
      rating: { quality: 5, communication: 5, speed: 5, feedback: "Very strong synthesis and recommendation quality." },
      completedAt: new Date("2026-03-22")
    },
    {
      volunteer: maya,
      task: landingTask,
      summary: "Improved the landing page hierarchy, tightened mobile spacing, and clarified the CTA story.",
      attachmentUrl: "https://files.example.com/maya-landing.fig",
      rating: { quality: 5, communication: 5, speed: 4, feedback: "Great product instincts and execution detail." },
      completedAt: new Date("2026-03-24")
    }
  ];

  for (const item of acceptanceData) {
    const submission = await prisma.submission.upsert({
      where: {
        taskId_volunteerProfileId: {
          taskId: item.task.id,
          volunteerProfileId: item.volunteer.id
        }
      },
      create: {
        taskId: item.task.id,
        volunteerProfileId: item.volunteer.id,
        textSummary: item.summary,
        attachmentUrl: item.attachmentUrl,
        status: "ACCEPTED"
      },
      update: {
        textSummary: item.summary,
        attachmentUrl: item.attachmentUrl,
        status: "ACCEPTED"
      }
    });

    await prisma.rating.upsert({
      where: { submissionId: submission.id },
      create: {
        submissionId: submission.id,
        quality: item.rating.quality,
        communication: item.rating.communication,
        speed: item.rating.speed,
        feedback: item.rating.feedback
      },
      update: {
        quality: item.rating.quality,
        communication: item.rating.communication,
        speed: item.rating.speed,
        feedback: item.rating.feedback
      }
    });

    await prisma.portfolioItem.upsert({
      where: { taskId: item.task.id },
      create: {
        volunteerProfileId: item.volunteer.id,
        taskId: item.task.id,
        submissionId: submission.id,
        taskTitle: item.task.title,
        organizationName: item.task.organizationId === citykind.id ? citykind.name : northstar.name,
        summary: item.summary,
        feedback: item.rating.feedback,
        rating: item.rating.quality,
        completedAt: item.completedAt
      },
      update: {
        volunteerProfileId: item.volunteer.id,
        submissionId: submission.id,
        taskTitle: item.task.title,
        organizationName: item.task.organizationId === citykind.id ? citykind.name : northstar.name,
        summary: item.summary,
        feedback: item.rating.feedback,
        rating: item.rating.quality,
        completedAt: item.completedAt
      }
    });
  }

  await prisma.$queryRaw`
    INSERT INTO "ImpactCv" (
      "id",
      "volunteerProfileId",
      "headline",
      "summary",
      "topSkills",
      "proofPoints",
      "metrics",
      "approvalNotes",
      "approvedByAi",
      "approvedAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${maya.id},
      ${"Power volunteer with a strong verified work history."},
      ${"Maya Rahmonova in Tashkent, Uzbekistan is open to paid work and has a verified history of using real tasks to build trust, ratings, and portfolio evidence."},
      ${textArraySql(["Project Coordination", "Community Research", "Content Writing", "Data Analysis"])},
      ${textArraySql([
        "Volunteer onboarding mini-guide at CityKind Collective (5/5)",
        "Neighborhood survey summary at CityKind Collective (5/5)",
        "Landing page polish sprint at Northstar Studio (5/5)"
      ])},
      ${textArraySql(["3 verified tasks", "110 impact score", "Rank #1", "5.0/5 average rating"])},
      ${textArraySql(["Seeded from verified portfolio items and ratings."])},
      ${true},
      ${new Date()},
      ${new Date()},
      ${new Date()}
    )
    ON CONFLICT ("volunteerProfileId")
    DO UPDATE SET
      "headline" = EXCLUDED."headline",
      "summary" = EXCLUDED."summary",
      "topSkills" = EXCLUDED."topSkills",
      "proofPoints" = EXCLUDED."proofPoints",
      "metrics" = EXCLUDED."metrics",
      "approvalNotes" = EXCLUDED."approvalNotes",
      "approvedByAi" = EXCLUDED."approvedByAi",
      "approvedAt" = EXCLUDED."approvedAt",
      "updatedAt" = NOW()
  `;

  await prisma.shortlist.upsert({
    where: {
      organizationProfileId_volunteerProfileId: {
        organizationProfileId: citykind.id,
        volunteerProfileId: maya.id
      }
    },
    create: {
      organizationProfileId: citykind.id,
      volunteerProfileId: maya.id,
      note: "Top performer with proven delivery across tasks and high-impact ratings."
    },
    update: {
      note: "Top performer with proven delivery across tasks and high-impact ratings."
    }
  });

  await prisma.shortlist.upsert({
    where: {
      organizationProfileId_volunteerProfileId: {
        organizationProfileId: northstar.id,
        volunteerProfileId: maya.id
      }
    },
    create: {
      organizationProfileId: northstar.id,
      volunteerProfileId: maya.id,
      note: "Would be a strong fit for senior volunteer or paid project work."
    },
    update: {
      note: "Would be a strong fit for senior volunteer or paid project work."
    }
  });

  await refreshVolunteerRankings();
  console.log("Maya demo account seeded and rankings refreshed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
