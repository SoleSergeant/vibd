import {
  ApplicationStatus,
  MessageThreadStatus,
  OpportunityStatus,
  PrismaClient,
  TaskDifficulty,
  TaskRewardType,
  TaskStatus,
  TaskVisibility,
  UserRole
} from "@prisma/client";
import { hashPassword } from "@/lib/security";
import { refreshVolunteerRankings } from "@/lib/ranking";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.taskApplication.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.volunteerBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.taskSkill.deleteMany();
  await prisma.task.deleteMany();
  await prisma.volunteerSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.organizationProfile.deleteMany();
  await prisma.user.deleteMany();

  const skills = await Promise.all([
    prisma.skill.create({ data: { name: "Project Coordination", slug: "project-coordination", category: "Operations" } }),
    prisma.skill.create({ data: { name: "Community Research", slug: "community-research", category: "Research" } }),
    prisma.skill.create({ data: { name: "Content Writing", slug: "content-writing", category: "Marketing" } }),
    prisma.skill.create({ data: { name: "Canva Design", slug: "canva-design", category: "Design" } }),
    prisma.skill.create({ data: { name: "Frontend Development", slug: "frontend-development", category: "Engineering" } }),
    prisma.skill.create({ data: { name: "Data Analysis", slug: "data-analysis", category: "Analytics" } })
  ]);

  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        name: "Verified Contributor",
        description: "Earned by completing accepted work.",
        icon: "shield-check"
      }
    }),
    prisma.badge.create({
      data: {
        name: "Fast Responder",
        description: "Known for speedy, reliable communication.",
        icon: "bolt"
      }
    }),
    prisma.badge.create({
      data: {
        name: "Impact Builder",
        description: "Consistently completes high-value tasks.",
        icon: "spark"
      }
    })
  ]);

  const orgUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "hello@citykind.org",
        name: "CityKind Collective",
        role: UserRole.ORGANIZATION,
        passwordHash: hashPassword("password123"),
        organizationProfile: {
          create: {
            name: "CityKind Collective",
            description: "A civic innovation nonprofit shipping small experiments for neighborhoods and community partners.",
            industry: "Nonprofit",
            location: "Tashkent",
            website: "https://citykind.example",
            verified: true
          }
        }
      },
      include: { organizationProfile: true }
    }),
    prisma.user.create({
      data: {
        email: "ops@northstarstudio.co",
        name: "Northstar Studio",
        role: UserRole.ORGANIZATION,
        passwordHash: hashPassword("password123"),
        organizationProfile: {
          create: {
            name: "Northstar Studio",
            description: "A small product studio looking for flexible junior talent for content, ops, and lightweight builds.",
            industry: "Startup",
            location: "Remote",
            website: "https://northstar.example",
            verified: true
          }
        }
      },
      include: { organizationProfile: true }
    })
  ]);

  const volunteerUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "amina@vibedwork.dev",
        name: "Amina Karimova",
        role: UserRole.VOLUNTEER,
        passwordHash: hashPassword("password123"),
        volunteerProfile: {
          create: {
            fullName: "Amina Karimova",
            bio: "Early-career community builder with a strong bias for delivery, documentation, and making teams look organized.",
            headline: "Operations-minded volunteer with real project proof.",
            interests: ["community programs", "social impact", "operations"],
            languages: ["English", "Uzbek", "Russian"],
            availability: "Evenings",
            opportunityStatus: OpportunityStatus.OPEN_PAID_WORK,
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-12-12")
          }
        }
      },
      include: { volunteerProfile: true }
    }),
    prisma.user.create({
      data: {
        email: "james@vibedwork.dev",
        name: "James Okafor",
        role: UserRole.VOLUNTEER,
        passwordHash: hashPassword("password123"),
        volunteerProfile: {
          create: {
            fullName: "James Okafor",
            bio: "Frontend learner who has already shipped landing pages, interview summaries, and volunteer task completions.",
            headline: "Design-aware frontend volunteer.",
            interests: ["web", "content", "design systems"],
            languages: ["English"],
            availability: "Flexible",
            opportunityStatus: OpportunityStatus.OPEN_INTERNSHIPS,
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-11-05")
          }
        }
      },
      include: { volunteerProfile: true }
    }),
    prisma.user.create({
      data: {
        email: "sara@vibedwork.dev",
        name: "Sara Ali",
        role: UserRole.VOLUNTEER,
        passwordHash: hashPassword("password123"),
        volunteerProfile: {
          create: {
            fullName: "Sara Ali",
            bio: "Research and content volunteer who turns rough notes into useful project deliverables.",
            headline: "Research, writing, and community support.",
            interests: ["research", "writing", "community"],
            languages: ["English", "Hindi"],
            availability: "Weekends",
            opportunityStatus: OpportunityStatus.OPEN_VOLUNTEER_WORK,
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-10-20")
          }
        }
      },
      include: { volunteerProfile: true }
    }),
    prisma.user.create({
      data: {
        email: "noah@vibedwork.dev",
        name: "Noah Petrov",
        role: UserRole.VOLUNTEER,
        passwordHash: hashPassword("password123"),
        volunteerProfile: {
          create: {
            fullName: "Noah Petrov",
            bio: "Data-minded volunteer who can help with lightweight analysis, dashboard cleanup, and process documentation.",
            headline: "Analytical volunteer with practical follow-through.",
            interests: ["analytics", "ops", "dashboards"],
            languages: ["English", "Russian"],
            availability: "Flexible",
            opportunityStatus: OpportunityStatus.OPEN_PAID_WORK,
            discoverable: true,
            verified: true,
            verifiedAt: new Date("2025-09-14")
          }
        }
      },
      include: { volunteerProfile: true }
    })
  ]);

  const citykind = orgUsers[0].organizationProfile!;
  const northstar = orgUsers[1].organizationProfile!;
  const amina = volunteerUsers[0].volunteerProfile!;
  const james = volunteerUsers[1].volunteerProfile!;
  const sara = volunteerUsers[2].volunteerProfile!;
  const noah = volunteerUsers[3].volunteerProfile!;

  await prisma.volunteerSkill.createMany({
    data: [
      { volunteerProfileId: amina.id, skillId: skills[0].id, proficiency: 5 },
      { volunteerProfileId: amina.id, skillId: skills[2].id, proficiency: 4 },
      { volunteerProfileId: james.id, skillId: skills[4].id, proficiency: 4 },
      { volunteerProfileId: james.id, skillId: skills[3].id, proficiency: 3 },
      { volunteerProfileId: sara.id, skillId: skills[1].id, proficiency: 5 },
      { volunteerProfileId: sara.id, skillId: skills[2].id, proficiency: 4 },
      { volunteerProfileId: noah.id, skillId: skills[5].id, proficiency: 5 },
      { volunteerProfileId: noah.id, skillId: skills[0].id, proficiency: 4 }
    ]
  });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        organizationId: citykind.id,
        title: "Volunteer onboarding mini-guide",
        description: "Create a short onboarding guide for new community volunteers, including first-week tasks, FAQ, and contact points.",
        category: "Operations",
        difficulty: TaskDifficulty.EASY,
        deadline: new Date("2026-04-08"),
        rewardType: TaskRewardType.EXPERIENCE,
        visibility: TaskVisibility.PUBLIC,
        status: TaskStatus.OPEN,
        location: "Remote",
        isRemote: true,
        taskSkills: {
          create: [{ skillId: skills[0].id }, { skillId: skills[2].id }]
        }
      }
    }),
    prisma.task.create({
      data: {
        organizationId: citykind.id,
        title: "Neighborhood survey summary",
        description: "Review community feedback, cluster the answers into themes, and draft a one-page insight summary for internal use.",
        category: "Research",
        difficulty: TaskDifficulty.MEDIUM,
        deadline: new Date("2026-04-15"),
        rewardType: TaskRewardType.INTERNSHIP,
        visibility: TaskVisibility.PUBLIC,
        status: TaskStatus.OPEN,
        location: "Hybrid",
        isRemote: true,
        taskSkills: {
          create: [{ skillId: skills[1].id }, { skillId: skills[5].id }]
        }
      }
    }),
    prisma.task.create({
      data: {
        organizationId: northstar.id,
        title: "Landing page polish sprint",
        description: "Improve the visual hierarchy and mobile responsiveness of a startup landing page. Copy and layout notes already available.",
        category: "Design",
        difficulty: TaskDifficulty.HARD,
        deadline: new Date("2026-04-10"),
        rewardType: TaskRewardType.HIRING,
        visibility: TaskVisibility.PUBLIC,
        status: TaskStatus.OPEN,
        location: "Remote",
        isRemote: true,
        taskSkills: {
          create: [{ skillId: skills[4].id }, { skillId: skills[3].id }]
        }
      }
    }),
    prisma.task.create({
      data: {
        organizationId: northstar.id,
        title: "Private content refresh",
        description: "Invite-only copy refresh for an upcoming product announcement.",
        category: "Marketing",
        difficulty: TaskDifficulty.MEDIUM,
        deadline: new Date("2026-04-18"),
        rewardType: TaskRewardType.STIPEND,
        stipendAmount: 150,
        visibility: TaskVisibility.PRIVATE,
        status: TaskStatus.OPEN,
        location: "Remote",
        isRemote: true,
        taskSkills: {
          create: [{ skillId: skills[2].id }]
        }
      }
    })
  ]);

  const [onboardingTask, surveyTask, landingTask, contentTask] = tasks;

  await prisma.taskApplication.createMany({
    data: [
      { taskId: onboardingTask.id, volunteerProfileId: amina.id, note: "I have built onboarding docs and can turn rough notes into a clear guide.", status: ApplicationStatus.SHORTLISTED },
      { taskId: onboardingTask.id, volunteerProfileId: sara.id, note: "Strong at concise docs and volunteer-facing copy.", status: ApplicationStatus.APPLIED },
      { taskId: surveyTask.id, volunteerProfileId: sara.id, note: "I can convert the survey themes into readable insights.", status: ApplicationStatus.SHORTLISTED },
      { taskId: landingTask.id, volunteerProfileId: james.id, note: "I can help refine the layout and responsive presentation.", status: ApplicationStatus.APPLIED },
      { taskId: landingTask.id, volunteerProfileId: noah.id, note: "I can support the product narrative and analytics visuals.", status: ApplicationStatus.APPLIED }
    ]
  });

  const onboardingSubmission = await prisma.submission.create({
    data: {
      taskId: onboardingTask.id,
      volunteerProfileId: amina.id,
      textSummary: "Drafted a volunteer onboarding guide with first-step actions, escalation contacts, and a weekly checklist.",
      attachmentUrl: "https://files.example.com/onboarding-guide.pdf",
      status: "ACCEPTED"
    }
  });

  const surveySubmission = await prisma.submission.create({
    data: {
      taskId: surveyTask.id,
      volunteerProfileId: sara.id,
      textSummary: "Grouped survey responses into three themes: access, scheduling, and communication. Included a concise recommendations section.",
      attachmentUrl: "https://files.example.com/survey-summary.docx",
      status: "ACCEPTED"
    }
  });

  const landingSubmission = await prisma.submission.create({
    data: {
      taskId: landingTask.id,
      volunteerProfileId: james.id,
      textSummary: "Improved the landing page sections, tightened the CTA hierarchy, and adjusted spacing for mobile layouts.",
      attachmentUrl: "https://files.example.com/landing-polish.fig",
      status: "ACCEPTED"
    }
  });

  const contentSubmission = await prisma.submission.create({
    data: {
      taskId: contentTask.id,
      volunteerProfileId: sara.id,
      textSummary: "Prepared a concise launch blog draft and social post options for the product announcement.",
      attachmentUrl: "https://files.example.com/launch-copy.md",
      status: "SUBMITTED"
    }
  });

  await prisma.rating.createMany({
    data: [
      { submissionId: onboardingSubmission.id, quality: 5, communication: 5, speed: 4, feedback: "Clear, practical, and ready to use." },
      { submissionId: surveySubmission.id, quality: 5, communication: 4, speed: 5, feedback: "Excellent synthesis and structure." },
      { submissionId: landingSubmission.id, quality: 4, communication: 5, speed: 4, feedback: "Strong visual instincts and clean execution." }
    ]
  });

  await prisma.portfolioItem.createMany({
    data: [
      {
        volunteerProfileId: amina.id,
        taskId: onboardingTask.id,
        submissionId: onboardingSubmission.id,
        taskTitle: onboardingTask.title,
        organizationName: citykind.name,
        summary: onboardingSubmission.textSummary,
        feedback: "Clear, practical, and ready to use.",
        rating: 5,
        completedAt: new Date("2026-03-10")
      },
      {
        volunteerProfileId: sara.id,
        taskId: surveyTask.id,
        submissionId: surveySubmission.id,
        taskTitle: surveyTask.title,
        organizationName: citykind.name,
        summary: surveySubmission.textSummary,
        feedback: "Excellent synthesis and structure.",
        rating: 5,
        completedAt: new Date("2026-03-14")
      },
      {
        volunteerProfileId: james.id,
        taskId: landingTask.id,
        submissionId: landingSubmission.id,
        taskTitle: landingTask.title,
        organizationName: northstar.name,
        summary: landingSubmission.textSummary,
        feedback: "Strong visual instincts and clean execution.",
        rating: 4,
        completedAt: new Date("2026-03-18")
      }
    ]
  });

  await prisma.shortlist.createMany({
    data: [
      { organizationProfileId: citykind.id, volunteerProfileId: amina.id, note: "Excellent fit for operations and community programs." },
      { organizationProfileId: citykind.id, volunteerProfileId: sara.id, note: "Great for research and communication work." },
      { organizationProfileId: northstar.id, volunteerProfileId: james.id, note: "Strong candidate for product and frontend support." },
      { organizationProfileId: northstar.id, volunteerProfileId: noah.id, note: "Great analytical thinking and reliable communication." }
    ]
  });

  const thread1 = await prisma.messageThread.create({
    data: {
      volunteerProfileId: amina.id,
      organizationProfileId: citykind.id,
      status: MessageThreadStatus.ACTIVE,
      isInvite: false,
      messages: {
        create: [
          { senderUserId: orgUsers[0].id, body: "We liked your onboarding work. Would you be open to a longer-term paid project?", type: "TEXT" },
          { senderUserId: volunteerUsers[0].id, body: "Absolutely. I’d love to learn more about the scope.", type: "TEXT" }
        ]
      }
    },
    include: { messages: true }
  });

  const thread2 = await prisma.messageThread.create({
    data: {
      volunteerProfileId: james.id,
      organizationProfileId: northstar.id,
      taskId: landingTask.id,
      status: MessageThreadStatus.REQUESTED,
      isInvite: true,
      messages: {
        create: [
          { senderUserId: orgUsers[1].id, body: "We’re inviting you to a private landing page sprint with a stipend.", type: "INVITE" }
        ]
      }
    },
    include: { messages: true }
  });

  await prisma.messageThread.create({
    data: {
      volunteerProfileId: noah.id,
      organizationProfileId: citykind.id,
      status: MessageThreadStatus.REQUESTED,
      isInvite: false,
      messages: {
        create: [
          { senderUserId: orgUsers[0].id, body: "We reviewed your analytics work and would like to start a conversation.", type: "TEXT" }
        ]
      }
    }
  });

  await prisma.message.createMany({
    data: [
      { threadId: thread1.id, senderUserId: orgUsers[0].id, body: "Can you join our volunteer coordination circle next week?", type: "TEXT" },
      { threadId: thread2.id, senderUserId: orgUsers[1].id, body: "If you accept, we’ll unlock the private brief and design notes.", type: "INVITE" }
    ]
  });

  await refreshVolunteerRankings(prisma);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
