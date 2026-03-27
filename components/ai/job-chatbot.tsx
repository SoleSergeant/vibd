"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { readJsonResponse } from "@/lib/fetch-json";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type Props = {
  taskId: string;
  taskTitle: string;
  organizationName: string;
  taskSkills: string[];
};

const starterQuestions = [
  "What skills will I gain from this job?",
  "What experience should I already have?",
  "What should I mention in my application?",
  "How can I stand out for this role?"
];

export function JobChatbot({ taskId, taskTitle, organizationName, taskSkills }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Ask me anything about ${taskTitle}. I can explain what the job needs, what skills you gain, and what experience helps.`
    }
  ]);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const visibleMessages = useMemo(() => messages, [messages]);

  const sendQuestion = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setQuestion("");

    try {
      const response = await fetch("/api/ai/job-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          question: trimmed,
          messages: nextMessages
        })
      });

      const data = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error((data?.error as string | undefined) || "Could not get an answer right now.");
      }

      const answer = typeof data?.answer === "string" ? data.answer : "";
      setMessages((current) => [...current, { role: "assistant", content: answer || "I could not generate an answer." }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get an answer right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-[color:rgba(45,138,227,0.18)] bg-[linear-gradient(180deg,rgba(45,138,227,0.06),rgba(255,255,255,1))]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Job coach chatbot</CardTitle>
            <p className="text-sm text-slate-600">Ask about this role, the skills you gain, and what experience helps.</p>
          </div>
          <Badge className="bg-[color:rgba(21,228,2,0.12)] text-[color:rgb(21,160,2)]">OpenAI-powered</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {taskSkills.map((skill) => (
            <Badge key={skill} className="bg-white text-slate-700 border border-slate-200">
              {skill}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          {visibleMessages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "assistant" ? "text-slate-700" : "text-slate-950"}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {message.role === "assistant" ? organizationName : "You"}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {starterQuestions.map((prompt) => (
            <Button key={prompt} type="button" variant="outline" className="text-left" onClick={() => void sendQuestion(prompt)}>
              {prompt}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about the job..."
            rows={4}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void sendQuestion(question)} disabled={isSubmitting}>
              {isSubmitting ? "Thinking..." : "Ask"}
            </Button>
            <p className="text-xs text-slate-500">You can ask about requirements, skills gained, experience needed, or how to stand out.</p>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
