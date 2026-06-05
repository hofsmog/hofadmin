import { CalendarRange } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createPlannerTaskAction } from "@/app/dashboard/operations/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function AnnualPlannerPage({ searchParams }: { searchParams?: Promise<{ created?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const [{ data: tasks }, { data: members }] = await Promise.all([
    db.from("annual_planner_tasks").select("id, title, description, category, due_date, recurrence, status, members(name)").eq("organization_id", organizationId).order("due_date", { ascending: true }).limit(50),
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
  ]);
  return (
    <>
      <PageHeader title="Annual Planner" description="Track recurring organizational tasks, deadlines, and responsibilities." />
      <Toast show={params.created === "1"} title="Planner task created" message="The task was added to the annual planner." />
      <Toast show={Boolean(params.error)} tone="error" title="Task not saved" message="Check the task details and try again." />
      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card><CardHeader><CardTitle>Create planner task</CardTitle><CardDescription>Use recurrence for monthly, quarterly, or yearly work.</CardDescription></CardHeader>
          <form action={createPlannerTaskAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Title</span><Input name="title" required placeholder="Renew insurance" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Description</span><Input name="description" placeholder="Optional description" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Category</span><Input name="category" placeholder="Finance, Safety, Admin" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Responsible person</span><select name="responsibleMemberId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">Unassigned</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Due date</span><Input name="dueDate" type="date" required /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Recurrence</span><select name="recurrence" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="none">None</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></label>
            <button className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Create task</button>
          </form>
        </Card>
        <Card><CardHeader><CardTitle>Planner tasks</CardTitle><CardDescription>Upcoming, due soon, overdue, and completed annual work.</CardDescription></CardHeader>
          <div className="divide-y px-5 pb-5">
            {(tasks ?? []).length ? tasks.map((task: any) => <article key={task.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{task.title}</p><Badge className="capitalize">{computedStatus(task.due_date, task.status).replaceAll("_", " ")}</Badge><Badge className="capitalize">{task.recurrence}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description || "No description"}</p><p className="mt-1 text-xs text-muted-foreground">{[task.category, task.members?.name].filter(Boolean).join(" - ") || "No category or owner"} - due {task.due_date}</p></article>) : <div className="rounded-xl border border-dashed p-8 text-center"><CalendarRange className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No planner tasks yet</p><p className="mt-1 text-sm text-muted-foreground">Add recurring annual work here.</p></div>}
          </div>
        </Card>
      </div>
    </>
  );
}

function computedStatus(dueDate: string, status: string) {
  if (status === "completed") return "completed";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 14) return "due_soon";
  return "upcoming";
}
