import { HfInference } from "@huggingface/inference";
import { DifficultyToScoreMap } from "@/lib/ai-types";

type DraftMessageInput = {
  volunteerName: string;
  volunteerBio: string;
  organizationName: string;
  taskTitle?: string | null;
  taskDescription?: string | null;
  goal: string;
  tone: string;
  priorRelationship?: string | null;
};

export type TaskRecommendation = {
  taskId: string;
  title: string;
  reason: string;
  score: number;
};

function getClient() {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) return null;
  return new HfInference(token);
}

function getModel() {
  return process.env.HF_MODEL?.trim() || "google/gemma-2-2b-it";
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

async function chatJson(prompt: string, system: string) {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.chatCompletion({
      model: getModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices?.[0]?.message?.content ?? "";
    return parseJson<Record<string, unknown>>(content);
  } catch {
    return null;
  }
}

export async function draftMessage(input: DraftMessageInput) {
  const fallback = [
    `Hi ${input.volunteerName},`,
    "",
    `I’m reaching out from ${input.organizationName}${input.taskTitle ? ` about ${input.taskTitle}` : ""}.`,
    input.goal,
    "",
    "If this sounds interesting, I’d love to continue the conversation."
  ].join("\n");

  const result = await chatJson(
    JSON.stringify(input),
    "You write concise, warm outreach messages for a hiring and volunteer platform. Return JSON with a single field named body. Keep the message under 120 words, specific, and professional. Do not mention that you are an AI."
  );

  return {
    body: typeof result?.body === "string" && result.body.trim() ? result.body.trim() : fallback
  };
}

function overlapScore(requiredSkills: string[], volunteerSkills: string[]) {
  const lowerVolunteer = volunteerSkills.map((skill) => skill.toLowerCase());
  const hits = requiredSkills.filter((skill) => lowerVolunteer.some((volunteerSkill) => volunteerSkill.includes(skill.toLowerCase())));
  return hits.length;
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
