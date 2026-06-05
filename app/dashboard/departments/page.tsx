/* eslint-disable @typescript-eslint/no-explicit-any */

import { Network, UsersRound } from "lucide-react";
import { createDepartmentAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function DepartmentsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: total }, { count: memberships }, { data: records }] = await Promise.all([
    db.from("departments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("department_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("departments").select("id, name, description, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  return <AdvancedRecordsPage title="Departments" description="Manage departments, teams, leaders, hierarchy, documents, and team activity." createTitle="Create department" createDescription="Start with a clear department or team name." listTitle="Departments and teams" listDescription="Organization structure foundation." action={createDepartmentAction} fields={[{ name: "name", label: "Department Name", required: true }, { name: "description", label: "Description", type: "textarea" }]} stats={[{ label: "Department Overview", value: total ?? 0, detail: "Departments and teams", icon: Network }, { label: "Team Activity", value: memberships ?? 0, detail: "Team member assignments", icon: UsersRound }, { label: "Department Documents", value: 0, detail: "Document links foundation", icon: Network }]} records={records ?? []} params={params} emptyTitle="No departments yet" emptyDescription="Create a department to organize teams, members, and documents." getRecordTitle={(record) => record.name} getRecordDescription={(record) => record.description || "No description"} getRecordMeta={(record) => `Created: ${new Date(record.created_at).toLocaleDateString()}`} getRecordStatus={() => null} />;
}
