"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { readJsonResponse } from "@/lib/fetch-json";

type TaskOption = {
  id: string;
  title: string;
};

type Props = {
  volunteerProfileId: string;
  volunteerName: string;
  organizationName: string;
  taskOptions: TaskOption[];
};

export function OutreachComposer({ volunteerProfileId, volunteerName, organizationName, taskOptions }: Props) {
  const [taskId, setTaskId] = useState("");
  const [goal, setGoal] = useState("Invite the volunteer to continue the conversation.");
  const [tone, setTone] = useState("warm");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const selectedTask = useMemo(() => taskOptions.find((task) => task.id === taskId) ?? null, [taskId, taskOptions]);

  const handleGenerate = () => {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/draft-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            volunteerProfileId,
            taskId: selectedTask?.id ?? null,
            goal,
            tone,
            priorRelationship: ""
          })
        });
        const data = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error((data?.error as string | undefined) || "Failed to generate message draft");
        }
        const draftBody = data?.draft && typeof data.draft === "object" ? (data.draft as { body?: unknown }).body : null;
        if (typeof draftBody !== "string" || !draftBody.trim()) {
          throw new Error("The assistant returned an empty message. Try again.");
        }
        setBody(draftBody);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate message draft");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI message drafting</CardTitle>
        <CardDescription>Generate an outreach message, then send it directly from VibedWork.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task context</label>
            <Select value={taskId} onChange={(event) => setTaskId(event.target.value)}>
              <option value="">No task attached</option>
              {taskOptions.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <Select value={tone} onChange={(event) => setTone(event.target.value)}>
              <option value="warm">Warm</option>
              <option value="direct">Direct</option>
              <option value="formal">Formal</option>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Goal</label>
          <Input value={goal} onChange={(event) => setGoal(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Draft message</label>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={`Hi ${volunteerName},`} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Generating..." : "Generate draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setBody(
                `Hi ${volunteerName},\n\nI’m reaching out from ${organizationName}. ${goal}\n\nIf this sounds interesting, I’d love to continue the conversation.`
              )
            }
          >
            Use fallback
          </Button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <form action="/api/threads" method="post" className="space-y-3">
          <input type="hidden" name="volunteerProfileId" value={volunteerProfileId} />
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="isInvite" value={taskId ? "true" : "false"} />
          <Textarea name="body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message body" />
          <Button type="submit" className="w-full" disabled={!body.trim()}>
            Send message
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
