import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateImpactCv, type ImpactCvInput } from "@/lib/ai";

type Props = {
  volunteer: ImpactCvInput["volunteer"];
};

export async function ImpactCvCard({ volunteer }: Props) {
  const cv = await generateImpactCv({ volunteer });

  return (
    <Card className="overflow-hidden border-[color:rgba(21,228,2,0.18)] bg-[linear-gradient(180deg,rgba(21,228,2,0.06),rgba(255,255,255,1))]">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{volunteer.fullName}</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              {volunteer.location ? `${volunteer.location} • ` : ""}
              {volunteer.availability}
            </p>
          </div>
          <Badge className="bg-[color:rgba(21,228,2,0.12)] text-[color:rgb(21,160,2)]">
            {cv.metrics.find((item) => item.includes("impact score")) ? "Proof-based" : "Verified proof"}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-slate-600">{cv.headline}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tasks</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{cv.metrics.find((item) => item.includes("task")) ?? `${volunteer.portfolioItems.length} tasks`}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Impact score</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{volunteer.impactScore}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rank</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{volunteer.ranking ? `#${volunteer.ranking}` : "Pending"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Badges</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{volunteer.badges.length}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{cv.suggestedTitle}</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{cv.summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cv.topSkills.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Numbers that prove it</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cv.metrics.map((item) => (
                <Badge key={item} className="bg-[color:rgba(45,138,227,0.12)] text-[color:hsl(var(--brand-blue))]">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Verified proof</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {cv.proofPoints.map((point) => (
                <li key={point}>- {point}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Use this in hiring</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Share this summary instead of a blank CV. It shows what was done, who it was done for, and the quality of the work.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
