import { prisma } from "@/lib/db";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { TaskCard } from "@/components/task-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      {tasks.length === 0 ? <p className="text-sm text-slate-500">No work cards matched your filters yet.</p> : null}
    </PageShell>
  );
}
