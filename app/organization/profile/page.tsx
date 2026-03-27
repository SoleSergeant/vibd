import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function OrganizationProfilePage() {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return <PageShell><p className="text-sm text-slate-600">Sign in as an organization to edit your profile.</p></PageShell>;
  }

  const profile = user.organizationProfile;
  return (
    <PageShell className="space-y-8 max-w-4xl">
      <SectionHeading eyebrow="Organization profile" title={profile.name} description="This profile appears in discovery and task ownership." />
      <Card>
        <CardContent className="space-y-4 p-6">
          <form action="/api/organization/profile" method="post" className="grid gap-4">
            <Input name="name" defaultValue={profile.name} />
            <Textarea name="description" defaultValue={profile.description} />
            <Input name="industry" defaultValue={profile.industry} />
            <Input name="location" defaultValue={profile.location} />
            <Input name="website" defaultValue={profile.website ?? ""} />
            <Button type="submit">Save profile</Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
