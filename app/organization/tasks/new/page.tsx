import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { QuickTaskPoster } from "@/components/organization/quick-task-poster";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return <PageShell><p className="text-sm text-slate-600">Sign in as an organization to create tasks.</p></PageShell>;
  }

  return (
    <PageShell className="max-w-6xl space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Post work</p>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Fill the structure once. Vibd turns it into a live post.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Add the core details, choose the reward and visibility, and publish without wrestling a blank form.
          </p>
        </div>
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="grid gap-3 p-5 text-sm text-slate-600">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[color:rgba(45,138,227,0.12)] px-3 py-1 font-medium text-[color:hsl(var(--brand-blue))]">1. Task details</span>
              <span className="rounded-full bg-[color:rgba(21,228,2,0.12)] px-3 py-1 font-medium text-[color:rgb(21,160,2)]">2. Skills and timing</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">3. Reward and visibility</span>
            </div>
            <p className="leading-6 text-slate-600">
              The post structure asks for the essentials organizations need to publish a clear, believable opportunity.
            </p>
          </CardContent>
        </Card>
      </section>

      <QuickTaskPoster />
    </PageShell>
  );
}
