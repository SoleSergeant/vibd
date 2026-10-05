"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { readJsonResponse } from "@/lib/fetch-json";

type Props = {
  volunteerProfileId: string;
  volunteerName: string;
};

type HrToolkitResponse = {
  score?: number;
  label?: string;
  summary?: string;
  screeningQuestions?: string[];
  shortlistNote?: string;
  strengths?: string[];
  redFlags?: string[];
};

export function HrToolsPanel({ volunteerProfileId, volunteerName }: Props) {
  const [toolkit, setToolkit] = useState<HrToolkitResponse | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAnalyze = () => {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/hr-tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ volunteerProfileId })
        });
        const data = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error((data?.error as string | undefined) || "Could not analyze this volunteer.");
        }
        setToolkit(data as HrToolkitResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not analyze this volunteer.");
      }
    });
  };

  return (
    <Card className="border-[color:rgba(45,138,227,0.18)] bg-[linear-gradient(180deg,rgba(45,138,227,0.06),rgba(255,255,255,1))]">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI HR tools</p>
            <h3 className="text-base font-semibold text-slate-950">{volunteerName}</h3>
          </div>
          {toolkit?.score != null ? (
            <Badge className="bg-[color:rgba(45,138,227,0.12)] text-[color:hsl(var(--brand-blue))]">{toolkit.score}/100 trust</Badge>
          ) : (
            <Badge className="bg-white text-slate-500">Trust score</Badge>
          )}
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Build a shortlist with trust, timing, and proof instead of guessing from a resume.
        </p>
        <Button type="button" onClick={handleAnalyze} disabled={isPending} className="w-full">
          {isPending ? "Analyzing..." : "Generate HR toolkit"}
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {toolkit ? (
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-900">{toolkit.label}</p>
            <p className="text-sm leading-6 text-slate-600">{toolkit.summary}</p>
            {toolkit.shortlistNote ? <p className="text-sm text-slate-700">{toolkit.shortlistNote}</p> : null}
            {toolkit.strengths?.length ? (
              <div className="flex flex-wrap gap-2">
                {toolkit.strengths.map((item) => (
                  <Badge key={item} className="border border-slate-200 bg-white text-slate-700">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : null}
            {toolkit.screeningQuestions?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Screening questions</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {toolkit.screeningQuestions.map((question) => (
                    <li key={question} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {toolkit.redFlags?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Watch outs</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {toolkit.redFlags.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
