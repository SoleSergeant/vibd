"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Preset = {
  label: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  rewardType: "EXPERIENCE" | "INTERNSHIP" | "HIRING" | "STIPEND";
};

const presets: Preset[] = [
  {
    label: "Volunteer onboarding",
    title: "Volunteer onboarding mini-guide",
    description:
      "Create a short onboarding guide for new volunteers, including first-week tasks, FAQ, and contact points.",
    category: "Operations",
    requiredSkills: "Project Coordination, Content Writing",
    difficulty: "EASY",
    rewardType: "EXPERIENCE"
  },
  {
    label: "Research summary",
    title: "Neighborhood survey summary",
    description:
      "Review community feedback, cluster the answers into themes, and draft a one-page insight summary for internal use.",
    category: "Research",
    requiredSkills: "Community Research, Data Analysis",
    difficulty: "MEDIUM",
    rewardType: "INTERNSHIP"
  },
  {
    label: "Design sprint",
    title: "Landing page polish sprint",
    description:
      "Improve the visual hierarchy and mobile responsiveness of a startup landing page. Copy and layout notes already available.",
    category: "Design",
    requiredSkills: "Frontend Development, Canva Design",
    difficulty: "HARD",
    rewardType: "HIRING"
  }
];

export function QuickTaskPoster() {
  const [template, setTemplate] = useState<Preset>(presets[0]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState(presets[0].title);
  const [previewDescription, setPreviewDescription] = useState(presets[0].description);
  const [previewCategory, setPreviewCategory] = useState(presets[0].category);
  const [previewSkills, setPreviewSkills] = useState(presets[0].requiredSkills);
  const [previewReward, setPreviewReward] = useState<Preset["rewardType"]>(presets[0].rewardType);
  const [previewVisibility, setPreviewVisibility] = useState("PUBLIC");
  const [previewDifficulty, setPreviewDifficulty] = useState<Preset["difficulty"]>(presets[0].difficulty);
  const [previewLocation, setPreviewLocation] = useState("Remote");

  const previewLabels = useMemo(
    () => ({
      title: previewTitle || template.title,
      description: previewDescription || template.description,
      category: previewCategory || template.category,
      skills: previewSkills || template.requiredSkills,
      reward: previewReward,
      visibility: previewVisibility,
      difficulty: previewDifficulty,
      location: previewLocation || "Remote"
    }),
    [previewCategory, previewDescription, previewDifficulty, previewLocation, previewReward, previewSkills, previewTitle, previewVisibility, template]
  );

  const applyTemplate = (item: Preset) => {
    setTemplate(item);
    setPreviewTitle(item.title);
    setPreviewDescription(item.description);
    setPreviewCategory(item.category);
    setPreviewSkills(item.requiredSkills);
    setPreviewReward(item.rewardType);
    setPreviewDifficulty(item.difficulty);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post structure</CardTitle>
        <CardDescription>Fill the key fields once and the app turns them into a live work post.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {presets.map((item) => (
            <Button key={item.label} type="button" variant={template.label === item.label ? "default" : "outline"} size="sm" onClick={() => applyTemplate(item)}>
              {item.label}
            </Button>
          ))}
        </div>

        <form id="task-create-form" action="/api/tasks" method="post" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                name="title"
                value={previewTitle}
                onChange={(event) => setPreviewTitle(event.target.value)}
                placeholder="What should volunteers do?"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                name="category"
                value={previewCategory}
                onChange={(event) => setPreviewCategory(event.target.value)}
                placeholder="Operations, Design, Research..."
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Work summary</label>
            <Textarea
              name="description"
              value={previewDescription}
              onChange={(event) => setPreviewDescription(event.target.value)}
              placeholder="Describe the task, expected output, and what success looks like."
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Skills needed</label>
              <Input
                name="requiredSkills"
                value={previewSkills}
                onChange={(event) => setPreviewSkills(event.target.value)}
                placeholder="Comma separated skills"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reward</label>
              <Select name="rewardType" value={previewReward} onChange={(event) => setPreviewReward(event.target.value as Preset["rewardType"])}>
                <option value="EXPERIENCE">Experience</option>
                <option value="INTERNSHIP">Internship opportunity</option>
                <option value="HIRING">Hiring opportunity</option>
                <option value="STIPEND">Optional stipend</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <Select name="visibility" value={previewVisibility} onChange={(event) => setPreviewVisibility(event.target.value)}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private invite-only</option>
              </Select>
            </div>
          </div>

          <button
            type="button"
            className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4"
            onClick={() => setAdvancedOpen((value) => !value)}
          >
            {advancedOpen ? "Hide advanced options" : "Show advanced options"}
          </button>

          {advancedOpen ? (
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select name="difficulty" value={previewDifficulty} onChange={(event) => setPreviewDifficulty(event.target.value as Preset["difficulty"])}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                  <option value="EXPERT">Expert</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <Input name="deadline" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  name="location"
                  value={previewLocation}
                  onChange={(event) => setPreviewLocation(event.target.value)}
                  placeholder="Remote, Tashkent, Hybrid..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stipend</label>
                <Input name="stipendAmount" type="number" placeholder="Optional amount" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remote</label>
                <Select name="isRemote" defaultValue="true">
                  <option value="true">Remote friendly</option>
                  <option value="false">Onsite</option>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit">Publish task</Button>
            <Button type="button" variant="outline" onClick={() => setAdvancedOpen(true)}>
              Add more details
            </Button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live preview</p>
              <h3 className="text-base font-semibold text-slate-950">{previewLabels.title}</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{previewLabels.visibility === "PRIVATE" ? "Invite only" : "Public"}</span>
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{previewLabels.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{previewLabels.category}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{previewLabels.reward}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{previewLabels.difficulty}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{previewLabels.location}</span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Skills: {previewLabels.skills}</p>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Required structure</p>
            <ul className="mt-2 space-y-1">
              <li>- What the work is</li>
              <li>- What success looks like</li>
              <li>- Skills needed</li>
              <li>- Reward and visibility</li>
              <li>- Deadline, location, and remote status if needed</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
