import { AlertCircle, Search } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createIssueAction } from "@/app/dashboard/operations/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function IssuesPage({ searchParams }: { searchParams?: Promise<{ q?: string; status?: string; priority?: string; created?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const q = String(params.q ?? "").trim();
  const status = String(params.status ?? "all");
  const priority = String(params.priority ?? "all");
  let query = db.from("issues").select("id, title, description, category, priority, status, created_at, members(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
  if (status !== "all") query = query.eq("status", status);
  if (priority !== "all") query = query.eq("priority", priority);
  const [{ data: issues }, { data: members }] = await Promise.all([
    query,
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
  ]);

  return (
    <>
      <PageHeader title="Issue Management" description="Create, assign, and track internal work in one simple issue inbox." />
      <Toast show={params.created === "1"} title="Issue created" message="The issue is ready for follow-up." />
      <Toast show={Boolean(params.error)} tone="error" title="Issue not saved" message="Check the issue details and try again." />
      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card><CardHeader><CardTitle>Create issue</CardTitle><CardDescription>Keep the first version simple and easy to triage.</CardDescription></CardHeader>
          <form action={createIssueAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Title</span><Input name="title" required placeholder="Projector needs setup" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Description</span><textarea name="description" rows={4} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm dark:bg-zinc-950" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Category</span><Input name="category" placeholder="IT, Facility, Admin" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><Select name="priority" label="Priority" options={["low", "normal", "high", "urgent"]} /><Select name="status" label="Status" options={["new", "in_progress", "waiting", "done", "closed"]} /></div>
            <label className="block space-y-2"><span className="text-sm font-medium">Assignee</span><select name="assigneeMemberId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">Unassigned</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Internal notes</span><Input name="internalNotes" placeholder="Optional staff note" /></label>
            <button className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Create issue</button>
          </form>
        </Card>
        <Card><CardHeader><CardTitle>Issues</CardTitle><CardDescription>Filter by status, priority, assignee, or category.</CardDescription></CardHeader>
          <form className="grid gap-3 p-5 pt-0 md:grid-cols-[1fr_10rem_10rem_auto]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={q} placeholder="Search issues" className="pl-9" /></div>
            <FilterSelect name="status" value={status} values={["all", "new", "in_progress", "waiting", "done", "closed"]} />
            <FilterSelect name="priority" value={priority} values={["all", "low", "normal", "high", "urgent"]} />
            <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Filter</button>
          </form>
          <div className="divide-y px-5 pb-5">
            {(issues ?? []).length ? issues.map((issue: any) => <article key={issue.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{issue.title}</p><Badge className="capitalize">{issue.status.replaceAll("_", " ")}</Badge><Badge className="capitalize">{issue.priority}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{issue.description || "No description"}</p><p className="mt-1 text-xs text-muted-foreground">{issue.category || "No category"} - {issue.members?.name || "Unassigned"} - {new Date(issue.created_at).toLocaleString()}</p></article>) : <Empty title="No issues yet" />}
          </div>
        </Card>
      </div>
    </>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) { return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><select name={name} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm capitalize dark:bg-zinc-950">{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>; }
function FilterSelect({ name, value, values }: { name: string; value: string; values: string[] }) { return <select name={name} defaultValue={value} className="h-11 rounded-xl border bg-white px-3 text-sm capitalize shadow-sm dark:bg-zinc-950">{values.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>; }
function Empty({ title }: { title: string }) { return <div className="rounded-xl border border-dashed p-8 text-center"><AlertCircle className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">New records will appear here.</p></div>; }
