"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { readJsonResponse } from "@/lib/fetch-json";

type PortfolioItem = {
  taskTitle: string;
  organizationName: string;
  summary: string;
  feedback: string;
  rating: number;
  completedAt: string;
};

type ProfileData = {
  fullName: string;
  location?: string | null;
  availability: string;
  opportunityStatus: string;
  impactScore: number;
  ranking: number;
  verified: boolean;
  badges: string[];
  skills: { name: string; proficiency: number }[];
  portfolioItems: PortfolioItem[];
};

type CvDraft = {
  headline: string;
  summary: string;
  topSkills: string[];
  proofPoints: string[];
  impactHighlights: string[];
  metrics: string[];
  approvedByAi?: boolean;
  approvalNotes?: string[];
};

type Props = {
  profile: ProfileData;
  initialCv: CvDraft;
  sharePath: string;
};

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function averageRating(portfolioItems: PortfolioItem[]) {
  if (!portfolioItems.length) return 0;
  return portfolioItems.reduce((sum, item) => sum + (item.rating || 0), 0) / portfolioItems.length;
}

export function ImpactCvEditor({ profile, initialCv, sharePath }: Props) {
  const [headline, setHeadline] = useState(initialCv.headline);
  const [summary, setSummary] = useState(initialCv.summary);
  const [topSkillsText, setTopSkillsText] = useState(initialCv.topSkills.join(", "));
  const [proofPointsText, setProofPointsText] = useState(initialCv.proofPoints.join("\n"));
  const [metricsText, setMetricsText] = useState(initialCv.metrics.join("\n"));
  const [approvalNotes, setApprovalNotes] = useState<string[]>(initialCv.approvalNotes ?? []);
  const [approvedByAi, setApprovedByAi] = useState(Boolean(initialCv.approvedByAi));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy share link");

  const topSkills = useMemo(() => splitCommaList(topSkillsText).slice(0, 6), [topSkillsText]);
  const proofPoints = useMemo(() => splitLines(proofPointsText).slice(0, 6), [proofPointsText]);
  const metrics = useMemo(() => splitLines(metricsText).slice(0, 6), [metricsText]);
  const completedTasks = profile.portfolioItems.length;
  const rating = averageRating(profile.portfolioItems);

  const applyDraft = (cv: CvDraft) => {
    setHeadline(cv.headline);
    setSummary(cv.summary);
    setTopSkillsText(cv.topSkills.join(", "));
    setProofPointsText(cv.proofPoints.join("\n"));
    setMetricsText(cv.metrics.join("\n"));
    setApprovalNotes(Array.isArray(cv.approvalNotes) ? cv.approvalNotes : []);
    setApprovedByAi(Boolean(cv.approvedByAi));
  };

  const handleUseAIDraft = () => {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/impact-cv-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const data = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error((data?.error as string | undefined) || "Could not load an AI draft");
        }

        const cv = data?.cv as CvDraft | undefined;
        if (!cv) {
          throw new Error("The AI draft service returned no CV data.");
        }

        applyDraft(cv);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load an AI draft");
      }
    });
  };

  const handleApprove = () => {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/approve-impact-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draft: {
              headline,
              summary,
              topSkills,
              proofPoints,
              metrics
            }
          })
        });

        const data = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error((data?.error as string | undefined) || "AI approval failed");
        }

        const cv = data?.cv as CvDraft | undefined;
        if (!cv) {
          throw new Error("The approval service returned no CV data.");
        }

        applyDraft(cv);
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI approval failed");
      }
    });
  };

  const handleCopyShareLink = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}${sharePath}` : sharePath;
    try {
      await navigator.clipboard.writeText(url);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy share link"), 1600);
    } catch {
      setError("Could not copy the share link. Please copy it from the address bar.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Edit your Impact CV</CardTitle>
            <Badge className={approvedByAi ? "bg-[color:rgba(21,228,2,0.12)] text-[color:rgb(21,160,2)]" : "bg-[color:rgba(45,138,227,0.12)] text-[color:hsl(var(--brand-blue))]"}>
              {approvedByAi ? "AI approved" : "Needs approval"}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Edit the story, but keep the evidence grounded. The approval step will only save a CV that can be tied back to verified work.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Headline</label>
            <Input value={headline} onChange={(event) => setHeadline(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Summary</label>
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Write a short proof-based summary."
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Top skills</label>
            <Textarea value={topSkillsText} onChange={(event) => setTopSkillsText(event.target.value)} placeholder="Comma separated skills" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Proof points</label>
            <Textarea
              value={proofPointsText}
              onChange={(event) => setProofPointsText(event.target.value)}
              placeholder="One proof point per line"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Metrics with numbers</label>
            <Textarea
              value={metricsText}
              onChange={(event) => setMetricsText(event.target.value)}
              placeholder="Examples: 3 verified tasks, 110 impact score, Rank #1"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleUseAIDraft} disabled={isPending}>
              {isPending ? "Loading AI draft..." : "Use AI draft"}
            </Button>
            <Button type="button" onClick={handleApprove} disabled={isPending}>
              {isPending ? "Approving..." : "Approve with AI"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setHeadline(initialCv.headline);
                setSummary(initialCv.summary);
                setTopSkillsText(initialCv.topSkills.join(", "));
                setProofPointsText(initialCv.proofPoints.join("\n"));
                setMetricsText(initialCv.metrics.join("\n"));
                setApprovalNotes(initialCv.approvalNotes ?? []);
                setApprovedByAi(Boolean(initialCv.approvedByAi));
              }}
            >
              Reset to draft
            </Button>
            <Button type="button" variant="outline" onClick={handleCopyShareLink}>
              {copyLabel}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {approvalNotes.length ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI approval notes</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                {approvalNotes.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[color:rgba(45,138,227,0.18)] bg-[linear-gradient(180deg,rgba(45,138,227,0.06),rgba(255,255,255,1))]">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {profile.location ? `${profile.location} • ` : ""}
                {profile.availability}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[color:rgba(45,138,227,0.12)] text-[color:hsl(var(--brand-blue))]">{profile.impactScore} impact score</Badge>
              <Badge className="bg-[color:rgba(21,228,2,0.12)] text-[color:rgb(21,160,2)]">
                {profile.ranking ? `Rank #${profile.ranking}` : "Rank pending"}
              </Badge>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">{headline}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tasks</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{completedTasks}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Avg rating</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{rating ? rating.toFixed(1) : "0.0"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Badges</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{profile.badges.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profile</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{profile.verified ? "Verified" : "In review"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Numbers that prove it</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {metrics.map((metric) => (
                  <Badge key={metric} className="bg-[color:rgba(45,138,227,0.12)] text-[color:hsl(var(--brand-blue))]">
                    {metric}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topSkills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Proof points</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {proofPoints.map((point) => (
                  <li key={point}>- {point}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why this works</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.slice(0, 4).map((skill) => (
                  <Badge key={skill.name} className="bg-[color:rgba(21,228,2,0.12)] text-[color:rgb(21,160,2)]">
                    {skill.name} {skill.proficiency}/5
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
