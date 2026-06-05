/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, Flag, Network } from "lucide-react";
import { createProjectAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function ProjectsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const today = new Date().toISOString().slice(0, 10);
  const soon = addDays(14);
  const [{ count: active }, { count: overdueTasks }, { count: milestones }, { data: records }] = await Promise.all([
    db.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    db.from("project_tasks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "completed").lt("due_date", today),
    db.from("project_milestones").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("completed_at", null).lte("due_date", soon),
    db.from("projects").select("id, name, description, status, due_date, progress, attachment_path, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  return <AdvancedRecordsPage title="Projects" description="Track projects, tasks, milestones, due dates, owners, progress, and activity." createTitle="Create project" createDescription="Start with a project goal, due date, and progress." listTitle="Projects" listDescription="Current project portfolio." action={createProjectAction} fields={[{ name: "name", label: "Project Name", required: true }, { name: "description", label: "Description", type: "textarea" }, { name: "status", label: "Status", type: "select", options: ["planning", "active", "on_hold", "completed", "cancelled"] }, { name: "dueDate", label: "Due Date", type: "date" }, { name: "progress", label: "Progress", type: "number", placeholder: "0" }, { name: "attachmentPath", label: "Attachment Path" }]} stats={[{ label: "Active Projects", value: active ?? 0, detail: "Currently active", icon: Network }, { label: "Overdue Tasks", value: overdueTasks ?? 0, detail: "Open tasks past due", icon: AlertTriangle }, { label: "Upcoming Milestones", value: milestones ?? 0, detail: "Due within 14 days", icon: Flag }]} records={records ?? []} params={params} emptyTitle="No projects yet" emptyDescription="Create a project to track goals, milestones, and progress." getRecordTitle={(record) => record.name} getRecordDescription={(record) => record.description || "No description"} getRecordMeta={(record) => `Due: ${record.due_date || "Not set"} - Progress: ${record.progress ?? 0}%`} getRecordStatus={(record) => record.status} />;
}

function addDays(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
