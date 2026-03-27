import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VolunteerProfilePage() {
  const user = await getCurrentUser();
  if (!user?.volunteerProfile) {
    return (
      <PageShell>
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Sign in as a volunteer to edit this profile.</CardContent>
        </Card>
      </PageShell>
    );
  }
  const allSkills = await prisma.skill.findMany({ orderBy: { category: "asc" } });
  const profile = user.volunteerProfile;

  return (
    <PageShell className="space-y-8">
      <SectionHeading eyebrow="Volunteer profile" title={profile.fullName} description="This profile powers discovery, ranking, and portfolio proof." />
      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Impact score</p>
              <p className="text-4xl font-semibold">{profile.impactScore}</p>
              <p className="text-sm text-slate-500">Rank #{profile.ranking || "unranked"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.volunteerProfile.badges.map((entry) => (
                <Badge key={entry.badgeId}>{entry.badge.name}</Badge>
              ))}
            </div>
            <div className="text-sm text-slate-600">
              <p>{profile.bio}</p>
              <p className="mt-2">Availability: {profile.availability}</p>
              <p>Status: {profile.opportunityStatus.toLowerCase().replaceAll("_", " ")}</p>
              <p>Discoverable: {profile.discoverable ? "Yes" : "No"}</p>
              {profile.verifiedAt ? <p>Verified {formatDate(profile.verifiedAt)}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Edit profile</h3>
            <form action="/api/volunteer/profile" method="post" className="grid gap-4">
              <Input name="fullName" defaultValue={profile.fullName} />
              <Input name="headline" defaultValue={profile.headline ?? ""} placeholder="Headline" />
              <Textarea name="bio" defaultValue={profile.bio} />
              <Input name="interests" defaultValue={profile.interests.join(", ")} placeholder="Interests, comma separated" />
              <Input name="languages" defaultValue={profile.languages.join(", ")} placeholder="Languages, comma separated" />
              <Input name="availability" defaultValue={profile.availability} />
              <Select name="opportunityStatus" defaultValue={profile.opportunityStatus}>
                <option value="OPEN_VOLUNTEER_WORK">Open to volunteer work</option>
                <option value="OPEN_INTERNSHIPS">Open to internships</option>
                <option value="OPEN_PAID_WORK">Open to paid work</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </Select>
              <Select name="discoverable" defaultValue={profile.discoverable ? "true" : "false"}>
                <option value="true">Visible in discovery</option>
                <option value="false">Hidden from discovery</option>
              </Select>
              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="text-lg font-semibold">Skill catalog snapshot</h3>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <Badge key={skill.id} className="bg-white">
                {skill.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
