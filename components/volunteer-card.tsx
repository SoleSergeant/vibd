import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export function VolunteerCard({
  volunteer,
  actions
}: {
  volunteer: {
    id: string;
    fullName: string;
    headline: string | null;
    bio: string;
    impactScore: number;
    ranking: number;
    opportunityStatus: string;
    discoverable: boolean;
    location: string | null;
    skills: { skill: { name: string } }[];
    badges: { badge: { name: string } }[];
  };
  actions?: React.ReactNode;
}) {
  return (
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-soft">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{volunteer.fullName}</CardTitle>
            {volunteer.headline ? <p className="mt-1 text-sm text-slate-500">{volunteer.headline}</p> : null}
          </div>
          <Badge>#{volunteer.ranking || "new"}</Badge>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{volunteer.bio}</p>
        <div className="flex flex-wrap gap-2">
          {volunteer.skills.slice(0, 4).map((item) => (
            <Badge key={item.skill.name} className="bg-white">
              {item.skill.name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span>Impact {volunteer.impactScore}</span>
          <span>•</span>
          <span>{volunteer.opportunityStatus.toLowerCase().replaceAll("_", " ")}</span>
          {volunteer.location ? (
            <>
              <span>•</span>
              <span>{volunteer.location}</span>
            </>
          ) : null}
        </div>
        {actions ? <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">{actions}</div> : null}
        <Link href={`/volunteer/profile?profile=${volunteer.id}`} className="text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
          Open profile
        </Link>
      </CardContent>
    </Card>
  );
}
