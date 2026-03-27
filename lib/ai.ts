import { HfInference } from "@huggingface/inference";
import { DifficultyToScoreMap } from "@/lib/ai-types";

type DraftMessageInput = {
  volunteerName: string;
  volunteerBio: string;
  volunteerSkills?: string[];
  volunteerHighlights?: string[];
  organizationName: string;
  taskTitle?: string | null;
  taskDescription?: string | null;
  taskSkills?: string[];
  extraContext?: string;
  goal: string;
  tone: string;
  priorRelationship?: string | null;
};

export type JobChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type JobChatInput = {
  question: string;
  messages: JobChatMessage[];
  task: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    rewardType: string;
    visibility: string;
    stipendAmount?: number | null;
    organizationName: string;
    organizationDescription?: string | null;
    organizationWebsite?: string | null;
    skills: string[];
  };
  volunteer?: {
    fullName: string;
    bio: string;
    skills: string[];
    interests: string[];
    availability: string;
    opportunityStatus: string;
    impactScore: number;
    ranking: number;
    verified: boolean;
  };
};

export type JobChatResult = {
  answer: string;
};

export type SkillMatchInput = {
  volunteer: {
    fullName: string;
    location?: string | null;
    bio: string;
    headline?: string | null;
    interests: string[];
    availability: string;
    opportunityStatus: string;
    impactScore: number;
    ranking: number;
    verified: boolean;
    badges: { badge: { name: string } }[];
    skills: { skill: { name: string }; proficiency: number }[];
    portfolioItems: {
      taskTitle: string;
      organizationName: string;
      summary: string;
      feedback: string;
      rating: number;
      completedAt: Date;
    }[];
  };
  task: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    rewardType: string;
    visibility: string;
    organizationName: string;
    skills: string[];
  };
};

export type ImpactCvInput = {
  volunteer: {
    fullName: string;
    location?: string | null;
    headline?: string | null;
    bio: string;
    interests: string[];
    availability: string;
    opportunityStatus: string;
    impactScore: number;
    ranking: number;
    verified: boolean;
    badges: string[];
    skills: { name: string; proficiency: number }[];
    portfolioItems: {
      taskTitle: string;
      organizationName: string;
      summary: string;
      feedback: string;
      rating: number;
      completedAt: Date;
    }[];
  };
};

export type TaskRecommendation = {
  taskId: string;
  title: string;
  reason: string;
  score: number;
};

export type SkillMatchResult = {
  score: number;
  fitLabel: string;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  nextStep: string;
};

export type ImpactCvResult = {
  headline: string;
  summary: string;
  topSkills: string[];
  proofPoints: string[];
  impactHighlights: string[];
  metrics: string[];
  suggestedTitle: string;
};

export type ImpactCvApprovalInput = {
  volunteer: ImpactCvInput["volunteer"];
  draft: ImpactCvResult;
};

export type ImpactCvApprovalResult = ImpactCvResult & {
  approvalNotes: string[];
  approvedByAi: boolean;
};

function getClient() {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) return null;
  return new HfInference(token);
}

function getModel() {
  return process.env.HF_MODEL?.trim() || "google/gemma-2-2b-it";
}

function getOpenAIKey() {
  const token = process.env.OPENAI_API_KEY?.trim();
  if (!token) return null;
  return token;
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

async function chatJson(prompt: string, system: string, maxTokens = 600) {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.chatCompletion({
      model: getModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.35,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    const content = response.choices?.[0]?.message?.content ?? "";
    return parseJson<Record<string, unknown>>(content);
  } catch {
    return null;
  }
}

async function chatOpenAI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, maxTokens = 500) {
  const key = getOpenAIKey();
  if (!key) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: getOpenAIModel(),
        messages,
        temperature: 0.35,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    const content = payload?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch {
    return null;
  }
}

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function asUniqueList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function takeFirst(values: string[], limit: number) {
  return asUniqueList(values).slice(0, limit);
}

function getVolunteerSkillNames(volunteer: SkillMatchInput["volunteer"]) {
  return volunteer.skills.map((item) => item.skill.name);
}

function overlapScore(requiredSkills: string[], volunteerSkills: string[]) {
  const lowerVolunteer = volunteerSkills.map((skill) => normalize(skill));
  return requiredSkills.filter((skill) => lowerVolunteer.some((volunteerSkill) => volunteerSkill.includes(normalize(skill)))).length;
}

function scoreToLabel(score: number) {
  if (score >= 85) return "Strong match";
  if (score >= 65) return "Good match";
  if (score >= 45) return "Potential match";
  return "Stretch match";
}

function buildSkillMatchFallback(input: SkillMatchInput): SkillMatchResult {
  const volunteerSkills = getVolunteerSkillNames(input.volunteer);
  const requiredSkills = input.task.skills;
  const matchedSkills = requiredSkills.filter((skill) =>
    volunteerSkills.some((volunteerSkill) => normalize(volunteerSkill).includes(normalize(skill)))
  );
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
  const skillHitCount = matchedSkills.length;
  const interestHits = input.volunteer.interests.filter((interest) =>
    normalize(`${input.task.title} ${input.task.description} ${input.task.category}`).includes(normalize(interest))
  );
  const badgeBonus = input.volunteer.badges.length * 3;
  const score = Math.max(
    12,
    Math.min(
      100,
      Math.round(skillHitCount * 22 + interestHits.length * 8 + badgeBonus + Math.min(15, input.volunteer.impactScore / 8))
    )
  );

  const reasons = [
    matchedSkills.length ? `Matched ${matchedSkills.length} required skills.` : "No direct skill overlap, but the profile still shows relevant experience.",
    interestHits.length ? `Interest overlap with ${interestHits.slice(0, 2).join(", ")}.` : `Open to ${input.volunteer.opportunityStatus.toLowerCase().replaceAll("_", " ")}.`,
    input.volunteer.verified ? "Verified work history adds trust." : "This profile is not verified yet."
  ];

  if (input.volunteer.badges.length) {
    reasons.push(`Badges: ${takeFirst(input.volunteer.badges.map((item) => item.badge.name), 2).join(", ")}.`);
  }

  const recentProof = input.volunteer.portfolioItems.slice(0, 2).map((item) => `${item.taskTitle} at ${item.organizationName}`);
  const summary = `${input.volunteer.fullName} looks like a ${scoreToLabel(score).toLowerCase()} for ${input.task.title}. ${
    matchedSkills.length
      ? `The strongest signal is the overlap in ${takeFirst(matchedSkills, 3).join(", ")}.`
      : "The match is more based on portfolio history and transferability than exact skill overlap."
  }`;

  return {
    score,
    fitLabel: scoreToLabel(score),
    summary,
    matchedSkills: takeFirst(matchedSkills, 5),
    missingSkills: takeFirst(missingSkills, 5),
    reasons,
    nextStep: recentProof.length
      ? `Reference recent proof from ${recentProof.join(" and ")} in the application note.`
      : "Mention one verified project and the fastest way you can start."
  };
}

function buildImpactCvFallback(volunteer: ImpactCvInput["volunteer"]): ImpactCvResult {
  const completedTasks = volunteer.portfolioItems.length;
  const averageRating = volunteer.portfolioItems.length
    ? volunteer.portfolioItems.reduce((sum, item) => sum + item.rating, 0) / volunteer.portfolioItems.length
    : 0;
  const topSkills = volunteer.skills
    .slice()
    .sort((a, b) => b.proficiency - a.proficiency)
    .map((item) => item.name)
    .slice(0, 5);
  const metrics = [
    `${completedTasks} verified task${completedTasks === 1 ? "" : "s"}`,
    `${volunteer.impactScore} impact score`,
    volunteer.ranking ? `Rank #${volunteer.ranking}` : "Rank pending",
    averageRating ? `${averageRating.toFixed(1)}/5 average rating` : "No ratings yet"
  ];
  const proofPoints = volunteer.portfolioItems.slice(0, 4).map((item) => {
    const ratingText = item.rating ? `${item.rating}/5` : "rated";
    return `${item.taskTitle} at ${item.organizationName} (${ratingText})`;
  });
  const impactHighlights = [
    `${volunteer.impactScore} impact score`,
    volunteer.ranking ? `Rank #${volunteer.ranking}` : "Unranked, building history",
    volunteer.badges.length ? `${volunteer.badges.length} verified badge${volunteer.badges.length === 1 ? "" : "s"}` : "No badges yet"
  ];

  return {
    headline: volunteer.headline || `${volunteer.fullName} turns verified work into career proof.`,
    summary:
      `${volunteer.fullName}${volunteer.location ? ` in ${volunteer.location}` : ""} is open to ${volunteer.opportunityStatus.toLowerCase().replaceAll("_", " ")} and has a verified history of using real tasks to build trust, ratings, and portfolio evidence.`,
    topSkills,
    proofPoints: proofPoints.length ? proofPoints : ["No portfolio items yet, but the profile is ready for verification."],
    impactHighlights,
    metrics,
    suggestedTitle: `Impact CV for ${volunteer.fullName}`
  };
}

async function aiMatch(input: SkillMatchInput) {
  const result = await chatJson(
    JSON.stringify(input),
    "You score volunteer-task fit for a work-to-hire platform. Return JSON with score (0-100), fitLabel, summary, matchedSkills (array), missingSkills (array), reasons (array of short strings), and nextStep. Be concrete and based on the provided profile and task data."
  );

  if (!result) return null;

  return {
    score: typeof result.score === "number" ? Math.max(0, Math.min(100, Math.round(result.score))) : 0,
    fitLabel: typeof result.fitLabel === "string" ? result.fitLabel : "Good match",
    summary: typeof result.summary === "string" ? result.summary : "",
    matchedSkills: Array.isArray(result.matchedSkills) ? takeFirst(result.matchedSkills as string[], 5) : [],
    missingSkills: Array.isArray(result.missingSkills) ? takeFirst(result.missingSkills as string[], 5) : [],
    reasons: Array.isArray(result.reasons) ? takeFirst(result.reasons as string[], 4) : [],
    nextStep: typeof result.nextStep === "string" ? result.nextStep : "Apply with a short note."
  } satisfies SkillMatchResult;
}

async function aiImpactCv(input: ImpactCvInput) {
  const result = await chatJson(
    JSON.stringify(input),
    "You write a proof-based impact CV for a volunteer platform. Return JSON with headline, summary, topSkills (array), proofPoints (array), impactHighlights (array), metrics (array of numeric proof with counts or ratings), and suggestedTitle. Keep it concise, specific, and based only on the provided portfolio and badge history."
  );

  if (!result) return null;

  return {
    headline: typeof result.headline === "string" ? result.headline : "",
    summary: typeof result.summary === "string" ? result.summary : "",
    topSkills: Array.isArray(result.topSkills) ? takeFirst(result.topSkills as string[], 6) : [],
    proofPoints: Array.isArray(result.proofPoints) ? takeFirst(result.proofPoints as string[], 5) : [],
    impactHighlights: Array.isArray(result.impactHighlights) ? takeFirst(result.impactHighlights as string[], 4) : [],
    metrics: Array.isArray(result.metrics) ? takeFirst(result.metrics as string[], 5) : [],
    suggestedTitle: typeof result.suggestedTitle === "string" ? result.suggestedTitle : ""
  } satisfies ImpactCvResult;
}

async function aiApproveImpactCv(input: ImpactCvApprovalInput) {
  const result = await chatJson(
    JSON.stringify(input),
    "You approve a volunteer's editable impact CV. Only approve claims grounded in the provided profile and portfolio. Return JSON with headline, summary, topSkills (array), proofPoints (array), impactHighlights (array), metrics (array), suggestedTitle, approved (boolean), and approvalNotes (array). If the draft is missing numbers or proof, add grounded numbers from the profile such as task count, impact score, rank, rating, and badge count. Keep the writing polished, specific, and human."
  );

  if (!result) return null;

  return {
    headline: typeof result.headline === "string" ? result.headline : input.draft.headline,
    summary: typeof result.summary === "string" ? result.summary : input.draft.summary,
    topSkills: Array.isArray(result.topSkills) ? takeFirst(result.topSkills as string[], 6) : input.draft.topSkills,
    proofPoints: Array.isArray(result.proofPoints) ? takeFirst(result.proofPoints as string[], 5) : input.draft.proofPoints,
    impactHighlights: Array.isArray(result.impactHighlights) ? takeFirst(result.impactHighlights as string[], 4) : input.draft.impactHighlights,
    metrics: Array.isArray(result.metrics) ? takeFirst(result.metrics as string[], 5) : input.draft.metrics,
    suggestedTitle: typeof result.suggestedTitle === "string" ? result.suggestedTitle : input.draft.suggestedTitle,
    approvalNotes: Array.isArray(result.approvalNotes) ? takeFirst(result.approvalNotes as string[], 4) : [],
    approvedByAi: Boolean(result.approved)
  } satisfies ImpactCvApprovalResult;
}

export async function draftMessage(input: DraftMessageInput) {
  const fallback = [
    `Hi ${input.volunteerName},`,
    "",
    `I'm reaching out from ${input.organizationName}${input.taskTitle ? ` about ${input.taskTitle}` : ""}.`,
    input.goal,
    input.extraContext ? `We wanted to share: ${input.extraContext}` : "",
    input.taskDescription ? `We especially thought of you because ${input.taskDescription}` : "",
    input.volunteerHighlights?.length ? `Your experience in ${takeFirst(input.volunteerHighlights, 3).join(", ")} stood out.` : "",
    input.taskSkills?.length ? `The opportunity would benefit from your strength in ${takeFirst(input.taskSkills, 3).join(", ")}.` : "",
    "",
    "If this sounds like a fit, I'd love to share the next step and hear your thoughts."
  ]
    .filter(Boolean)
    .join("\n");

  const result = await chatJson(
    JSON.stringify(input),
    "You write detailed, warm outreach messages for a hiring and volunteer platform. Return JSON with a single field named body. Keep the message 130-220 words, specific, and professional. Mention why this person was selected, what the organization needs, how their background fits, and end with a concrete next step. Use any extra context provided. Do not mention that you are an AI."
  );

  return {
    body: typeof result?.body === "string" && result.body.trim() ? result.body.trim() : fallback
  };
}

function buildJobChatFallback(input: JobChatInput) {
  const requiredSkills = takeFirst(input.task.skills, 5);
  const volunteerSkills = takeFirst(input.volunteer?.skills ?? [], 5);
  const overlap = requiredSkills.filter((skill) =>
    volunteerSkills.some((volunteerSkill) => normalize(volunteerSkill).includes(normalize(skill)))
  );
  const missing = requiredSkills.filter((skill) => !overlap.includes(skill));
  const answer = [
    `Here’s the practical breakdown for ${input.task.title} at ${input.task.organizationName}.`,
    "",
    `What you need: ${requiredSkills.length ? requiredSkills.join(", ") : "general communication, follow-through, and a willingness to learn."}`,
    `What you gain: ${requiredSkills.length ? `experience in ${requiredSkills.slice(0, 3).join(", ")} and a stronger portfolio entry.` : "hands-on project experience and a portfolio proof point."}`,
    `Experience level: ${input.task.difficulty.toLowerCase()} work usually rewards people who can communicate clearly, manage deadlines, and ship clean work.`,
    overlap.length ? `You already match: ${overlap.join(", ")}.` : "Your current profile does not show a direct overlap, but the task still looks learnable with a strong application.",
    missing.length ? `Skills to build: ${missing.join(", ")}.` : "",
    input.volunteer ? `Based on your profile, the best next step is to mention your existing strengths in ${volunteerSkills.slice(0, 3).join(", ")} and show one relevant example.` : "",
    input.task.organizationWebsite ? `Organization: ${input.task.organizationWebsite}` : "",
    input.task.stipendAmount ? `Stipend: $${input.task.stipendAmount}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return { answer };
}

export async function answerJobQuestion(input: JobChatInput): Promise<JobChatResult> {
  const conversation = input.messages.slice(-8).map((message) => ({
    role: message.role,
    content: message.content
  }));

  const prompt = [
    `Task: ${input.task.title}`,
    `Organization: ${input.task.organizationName}`,
    `Category: ${input.task.category}`,
    `Difficulty: ${input.task.difficulty}`,
    `Reward: ${input.task.rewardType}`,
    `Visibility: ${input.task.visibility}`,
    `Task skills: ${input.task.skills.join(", ") || "none listed"}`,
    `Task description: ${input.task.description}`,
    input.task.organizationDescription ? `Organization description: ${input.task.organizationDescription}` : "",
    input.task.organizationWebsite ? `Organization website: ${input.task.organizationWebsite}` : "",
    input.volunteer
      ? [
          `Volunteer: ${input.volunteer.fullName}`,
          `Volunteer skills: ${input.volunteer.skills.join(", ") || "none listed"}`,
          `Volunteer interests: ${input.volunteer.interests.join(", ") || "none listed"}`,
          `Availability: ${input.volunteer.availability}`,
          `Opportunity status: ${input.volunteer.opportunityStatus}`,
          `Impact score: ${input.volunteer.impactScore}`,
          `Rank: ${input.volunteer.ranking}`,
          `Verified: ${input.volunteer.verified ? "yes" : "no"}`
        ].join("\n")
      : "",
    `Question: ${input.question}`,
    conversation.length
      ? `Conversation so far:\n${conversation
          .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
          .join("\n")}`
      : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  const system = [
    "You are Vibd's volunteer job coach.",
    "Answer questions about a specific task clearly and practically.",
    "Explain what the volunteer needs to apply, what skills they will likely gain, what experience helps, and what to ask the organization.",
    "If information is missing, say so instead of inventing details.",
    "Keep the answer concise but useful, around 120-180 words, and use bullets when helpful.",
    "Be honest about the difference between required skills and nice-to-have skills.",
    "Do not mention that you are an AI."
  ].join(" ");

  const aiAnswer = await chatOpenAI(
    [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ],
    350
  );

  return aiAnswer ? { answer: aiAnswer } : buildJobChatFallback(input);
}

export async function recommendTasks(params: {
  volunteer: {
    fullName: string;
    bio: string;
    interests: string[];
    availability: string;
    opportunityStatus: string;
    skills: { skill: { name: string } }[];
    impactScore: number;
    ranking: number;
  };
  tasks: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    rewardType: string;
    taskSkills: { skill: { name: string } }[];
    organization: { name: string };
  }[];
}) {
  const volunteerSkills = params.volunteer.skills.map((item) => item.skill.name);
  const heuristic = params.tasks.map((task) => {
    const skillHits = overlapScore(task.taskSkills.map((item) => item.skill.name), volunteerSkills);
    const difficultyBias = DifficultyToScoreMap[task.difficulty as keyof typeof DifficultyToScoreMap] ?? 0;
    const score = skillHits * 12 + difficultyBias + Math.min(20, params.volunteer.impactScore / 10);
    return {
      taskId: task.id,
      title: task.title,
      reason: `${skillHits} skill matches with ${task.organization.name}.`,
      score
    };
  });

  const client = getClient();
  if (!client || !params.tasks.length) {
    return heuristic.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  const result = await chatJson(
    JSON.stringify({
      volunteer: {
        name: params.volunteer.fullName,
        bio: params.volunteer.bio,
        interests: params.volunteer.interests,
        availability: params.volunteer.availability,
        opportunityStatus: params.volunteer.opportunityStatus,
        skills: volunteerSkills,
        impactScore: params.volunteer.impactScore,
        ranking: params.volunteer.ranking
      },
      tasks: params.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        difficulty: task.difficulty,
        rewardType: task.rewardType,
        skills: task.taskSkills.map((item) => item.skill.name),
        organization: task.organization.name
      }))
    }),
    "You rank tasks for a volunteer marketplace. Return JSON with a recommendations array of objects containing taskId, score, and reason. Use skill overlap, difficulty fit, interest fit, and availability. Keep the top 5 results."
  );

  const recommendations = Array.isArray(result?.recommendations)
    ? (result.recommendations as Array<{ taskId?: string; score?: number; reason?: string }>)
        .filter((item) => typeof item.taskId === "string")
        .map((item) => ({
          taskId: item.taskId as string,
          score: typeof item.score === "number" ? item.score : 0,
          reason: typeof item.reason === "string" ? item.reason : "Suggested by AI"
        }))
    : [];

  if (!recommendations.length) {
    return heuristic.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  const byId = new Map(heuristic.map((item) => [item.taskId, item]));
  return recommendations
    .map((item) => byId.get(item.taskId) ?? item)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function matchSkillToTask(input: SkillMatchInput): Promise<SkillMatchResult> {
  const ai = await aiMatch(input);
  return ai ?? buildSkillMatchFallback(input);
}

export async function generateImpactCv(input: ImpactCvInput): Promise<ImpactCvResult> {
  const ai = await aiImpactCv(input);
  return ai ?? buildImpactCvFallback(input.volunteer);
}

export async function approveImpactCv(input: ImpactCvApprovalInput): Promise<ImpactCvApprovalResult> {
  const ai = await aiApproveImpactCv(input);
  if (ai) {
    return ai;
  }

  const fallback = buildImpactCvFallback(input.volunteer);
  return {
    ...fallback,
    approvalNotes: [
      "Approved from verified profile data because the AI service was unavailable.",
      "Numbers are grounded in completed tasks, ratings, impact score, and ranking."
    ],
    approvedByAi: false
  };
}
