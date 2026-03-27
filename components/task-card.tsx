import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export function TaskCard({
  task,
  showOrganization = true
}: {
  task: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    deadline: Date;
    rewardType: string;
    visibility: string;
    organization: { name: string };
    taskSkills: { skill: { name: string } }[];
  };
  showOrganization?: boolean;
}) {
  return (
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-soft">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge>{task.category}</Badge>
          <Badge>{task.difficulty.toLowerCase()}</Badge>
          <Badge>{task.rewardType.toLowerCase()}</Badge>
          <Badge>{task.visibility.toLowerCase()}</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle>{task.title}</CardTitle>
          {showOrganization ? <CardDescription>By {task.organization.name}</CardDescription> : null}
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">{task.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {task.taskSkills.slice(0, 3).map((item) => (
            <span key={item.skill.name} className="rounded-full bg-slate-100 px-2.5 py-1">
              {item.skill.name}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Deadline {formatDate(task.deadline)}</span>
          <Link href={`/tasks/${task.id}`} className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            View task
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
