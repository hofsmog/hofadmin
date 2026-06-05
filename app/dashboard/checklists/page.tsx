import { CheckSquare } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createChecklistAction } from "@/app/dashboard/operations/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

const templates = ["Fire Safety Inspection", "IT Inspection", "Cleaning Checklist", "Opening Routine", "Closing Routine", "Security Inspection"];

export default async function ChecklistsPage({ searchParams }: { searchParams?: Promise<{ created?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const [{ data: checklists }, { data: members }] = await Promise.all([
    db.from("checklists").select("id, title, template_name, due_date, status, items, members(name)").eq("organization_id", organizationId).order("due_date", { ascending: true, nullsFirst: false }).limit(50),
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
  ]);
  return (
    <>
      <PageHeader title="Checklists" description="Create routine templates, assign work, and track completion." />
      <Toast show={params.created === "1"} title="Checklist created" message="The checklist is ready to complete." />
      <Toast show={Boolean(params.error)} tone="error" title="Checklist not saved" message="Check the checklist details and try again." />
      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card><CardHeader><CardTitle>Create checklist</CardTitle><CardDescription>Start from a common routine or create your own.</CardDescription></CardHeader>
          <form action={createChecklistAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Title</span><Input name="title" required placeholder="Weekly fire safety check" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Template</span><select name="templateName" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">Custom</option>{templates.map((template) => <option key={template} value={template}>{template}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Assigned user</span><select name="assignedMemberId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">Unassigned</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Due date</span><Input name="dueDate" type="date" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Checklist items</span><textarea name="items" rows={5} placeholder="One item per line" className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm dark:bg-zinc-950" /></label>
            <button className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Create checklist</button>
          </form>
        </Card>
        <Card><CardHeader><CardTitle>Open checklists</CardTitle><CardDescription>Incomplete routines and inspections.</CardDescription></CardHeader>
          <div className="divide-y px-5 pb-5">
            {(checklists ?? []).length ? checklists.map((checklist: any) => <article key={checklist.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{checklist.title}</p><Badge className="capitalize">{checklist.status}</Badge>{isOverdue(checklist.due_date, checklist.status) ? <Badge className="border-red-200 bg-red-50 text-red-800">Overdue</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">{checklist.template_name || "Custom checklist"} - due {checklist.due_date || "No date"}</p><p className="mt-1 text-xs text-muted-foreground">{checklist.members?.name || "Unassigned"} - {(checklist.items ?? []).length} items</p></article>) : <div className="rounded-xl border border-dashed p-8 text-center"><CheckSquare className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No checklists yet</p><p className="mt-1 text-sm text-muted-foreground">Create a checklist to track routine work.</p></div>}
          </div>
        </Card>
      </div>
    </>
  );
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "completed") return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(`${dueDate}T00:00:00`) < today;
}
