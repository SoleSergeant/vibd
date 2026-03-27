import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { matchSkillToTask, type SkillMatchInput } from "@/lib/ai";

type Props = {
  volunteer: SkillMatchInput["volunteer"];
  task: SkillMatchInput["task"];
};

export async function SkillMatchCard({ volunteer, task }: Props) {
  const match = await matchSkillToTask({ volunteer, task });

  return (
    <Card className="border-[color:rgba(45,138,227,0.18)] bg-[linear-gradient(180deg,rgba(45,138,227,0.06),rgba(255,255,255,1))]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>AI skill match</CardTitle>
          <Badge className="bg-[color:rgba(45,138,227,0.12)] text-[color:hsl(var(--brand-blue))]">{match.fitLabel}</Badge>
        </div>
        <p className="text-sm leading-6 text-slate-600">{match.summary}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Score</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{match.score}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why it fits</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {match.matchedSkills.length ? (
                match.matchedSkills.map((skill) => (
                  <Badge key={skill} className="bg-[color:rgba(21,228,2,0.12)] text-[color:rgb(21,160,2)]">
                    {skill}
                  </Badge>
                ))
              ) : (
                <Badge>Portfolio-first match</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Signals</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
              {match.reasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What to say next</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{match.nextStep}</p>
            {match.missingSkills.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {match.missingSkills.map((skill) => (
                  <Badge key={skill}>
                    Missing: {skill}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
