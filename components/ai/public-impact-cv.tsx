import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImpactCvResult } from "@/lib/ai";

type ProfileData = {
  fullName: string;
  location?: string | null;
  availability: string;
  impactScore: number;
  ranking: number;
  verified: boolean;
  badges: string[];
  skills: { name: string; proficiency: number }[];
  portfolioItems: {
    taskTitle: string;
    organizationName: string;
    rating: number;
    completedAt: Date;
  }[];
};

type Props = {
  profile: ProfileData;
  cv: ImpactCvResult & {
    approvedByAi?: boolean;
    approvalNotes?: string[] | null;
    approvedAt?: string | Date | null;
  };
};

function averageRating(portfolioItems: ProfileData["portfolioItems"]) {
  if (!portfolioItems.length) return 0;
  return portfolioItems.reduce((sum, item) => sum + (item.rating || 0), 0) / portfolioItems.length;
}

export function PublicImpactCv({ profile, cv }: Props) {
  const tasksCompleted = profile.portfolioItems.length;
  const avgRating = averageRating(profile.portfolioItems);

  return (
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
            <Badge className={cv.approvedByAi ? "bg-[color:rgba(21,228,2,0.12)] text-[color:rgb(21,160,2)]" : "bg-slate-100 text-slate-700"}>
              {cv.approvedByAi ? "AI approved" : "Reviewed"}
            </Badge>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600">{cv.headline}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tasks</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{tasksCompleted}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Avg rating</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{avgRating ? avgRating.toFixed(1) : "0.0"}</p>
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
          <p className="mt-3 text-sm leading-7 text-slate-700">{cv.summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cv.topSkills.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Numbers that prove it</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cv.metrics.map((metric) => (
                <Badge key={metric} className="bg-[color:rgba(45,138,227,0.12)] text-[color:hsl(var(--brand-blue))]">
                  {metric}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Proof points</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {cv.proofPoints.map((point) => (
                <li key={point}>- {point}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What this says</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This CV is built from verified work, ratings, and portfolio evidence. It is designed to show not only what the volunteer can do, but the numbers that back it up.
            </p>
          </div>
        </div>

        {cv.approvalNotes?.length ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Approval notes</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {cv.approvalNotes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
