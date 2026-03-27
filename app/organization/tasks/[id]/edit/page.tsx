import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.organizationProfile) {
    return <PageShell><p className="text-sm text-slate-600">Sign in as an organization to edit tasks.</p></PageShell>;
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: { taskSkills: { include: { skill: true } } }
  });
  if (!task || task.organizationId !== user.organizationProfile.id) notFound();

  return (
    <PageShell className="max-w-6xl space-y-6">
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.85fr,1.15fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current post</p>
            <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-slate-950">{task.title}</h1>
            <p className="text-sm leading-6 text-slate-600">{task.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>{task.visibility === "PRIVATE" ? "Invite only" : "Public"}</Badge>
              <Badge>{task.category}</Badge>
              <Badge>{task.difficulty}</Badge>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Edit structure</p>
              <ul className="mt-2 space-y-1">
                <li>- Task title and summary</li>
                <li>- Required skills and category</li>
                <li>- Reward, visibility, and timing</li>
                <li>- Location and remote preference</li>
              </ul>
            </div>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Edit post</CardTitle>
              <CardDescription>Update the structure without losing the original shape of the work.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="task-edit-form" action={`/api/tasks/${task.id}/update`} method="post" className="space-y-5">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Title</label>
                  <Input name="title" defaultValue={task.title} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Description</label>
                  <Textarea name="description" defaultValue={task.description} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Category</label>
                    <Input name="category" defaultValue={task.category} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Required skills</label>
                    <Input
                      name="requiredSkills"
                      defaultValue={task.taskSkills.map((item) => item.skill.name).join(", ")}
                      placeholder="Required skills, comma separated"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Difficulty</label>
                    <Select name="difficulty" defaultValue={task.difficulty}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                      <option value="EXPERT">Expert</option>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Reward</label>
                    <Select name="rewardType" defaultValue={task.rewardType}>
                      <option value="EXPERIENCE">Experience</option>
                      <option value="INTERNSHIP">Internship opportunity</option>
                      <option value="HIRING">Hiring opportunity</option>
                      <option value="STIPEND">Optional stipend</option>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Deadline</label>
                    <Input name="deadline" type="date" defaultValue={task.deadline.toISOString().slice(0, 10)} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Stipend</label>
                    <Input name="stipendAmount" type="number" defaultValue={task.stipendAmount ?? ""} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Visibility</label>
                    <Select name="visibility" defaultValue={task.visibility}>
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private invite-only</option>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Location</label>
                    <Input name="location" defaultValue={task.location ?? ""} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Remote</label>
                  <Select name="isRemote" defaultValue={task.isRemote ? "true" : "false"}>
                    <option value="true">Remote friendly</option>
                    <option value="false">Onsite</option>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                  <Button type="submit">Save changes</Button>
                  <ButtonLink href="/organization/tasks/new" variant="outline">
                    New post
                  </ButtonLink>
                </div>
              </form>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </PageShell>
  );
}
