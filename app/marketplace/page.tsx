import { prisma } from "@/lib/db";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { TaskCard } from "@/components/task-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    category?: string;
    difficulty?: string;
    reward?: string;
  };
}) {
  const difficulty = searchParams?.difficulty ? (searchParams.difficulty as never) : undefined;
  const reward = searchParams?.reward ? (searchParams.reward as never) : undefined;
  const tasks = await prisma.task.findMany({
    where: {
      visibility: "PUBLIC",
      status: "OPEN",
      title: searchParams?.q ? { contains: searchParams.q, mode: "insensitive" } : undefined,
      category: searchParams?.category || undefined,
      difficulty,
      rewardType: reward
    },
    include: {
      organization: true,
      taskSkills: { include: { skill: true } }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return (
    <PageShell className="space-y-8">
      <SectionHeading
        eyebrow="Workboard"
        title="Browse real work organizations need help with."
        description="Search by category and difficulty, then open a task to apply or submit work."
      />

      <Card className="border-[color:rgba(45,138,227,0.18)] bg-[linear-gradient(180deg,rgba(45,138,227,0.06),rgba(255,255,255,1))]">
        <CardContent className="flex flex-wrap items-center gap-2 p-5">
          <span className="rounded-full bg-[color:rgba(21,228,2,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgb(21,160,2)]">
            AI-powered
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Filter by skills, reward, and difficulty
          </span>
        </CardContent>
      </Card>

      <form className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-5" method="get">
        <Input name="q" defaultValue={searchParams?.q} placeholder="Search tasks" className="lg:col-span-2" />
        <Input name="category" defaultValue={searchParams?.category} placeholder="Category" />
        <Select name="difficulty" defaultValue={searchParams?.difficulty ?? ""}>
          <option value="">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
          <option value="EXPERT">Expert</option>
        </Select>
        <Select name="reward" defaultValue={searchParams?.reward ?? ""}>
          <option value="">All rewards</option>
          <option value="EXPERIENCE">Experience</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="HIRING">Hiring</option>
          <option value="STIPEND">Stipend</option>
        </Select>
        <div className="lg:col-span-5">
          <Button type="submit">Filter tasks</Button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {tasks.length ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <Card className="border-dashed border-slate-300 bg-slate-50">
            <CardContent className="space-y-3 p-6">
              <p className="text-base font-semibold text-slate-950">No tasks matched your filters yet.</p>
              <p className="text-sm leading-6 text-slate-600">
                Try a broader search or different reward type. Vibd will keep the workboard readable even when the filter set is narrow.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
