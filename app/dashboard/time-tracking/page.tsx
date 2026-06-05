/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarRange, CheckCircle2, Clock } from "lucide-react";
import { createTimeEntryAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function TimeTrackingPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  const [{ count: pending }, { count: approved }, { data: records }] = await Promise.all([
    db.from("time_entries").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "submitted"),
    db.from("time_entries").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "approved"),
    db.from("time_entries").select("id, entry_type, started_at, ended_at, hours, status, notes, created_at").eq("organization_id", organizationId).order("started_at", { ascending: false }).limit(50),
  ]);
  const hoursThisWeek = (records ?? []).filter((record: any) => new Date(record.started_at) >= weekStart).reduce((sum: number, record: any) => sum + Number(record.hours ?? 0), 0);
  return <AdvancedRecordsPage title="Time Tracking" description="Track work sessions, volunteer hours, manual entries, reports, and approvals." createTitle="Create time entry" createDescription="Add a clock session or manual time entry." listTitle="Time entries" listDescription="Recent work and volunteer hour records." action={createTimeEntryAction} fields={[{ name: "entryType", label: "Entry Type", type: "select", options: ["work", "volunteer"] }, { name: "startedAt", label: "Started At", type: "datetime-local", required: true }, { name: "endedAt", label: "Ended At", type: "datetime-local" }, { name: "hours", label: "Hours", type: "number" }, { name: "status", label: "Status", type: "select", options: ["draft", "submitted", "approved", "rejected"] }, { name: "notes", label: "Notes", type: "textarea" }]} stats={[{ label: "Hours This Week", value: hoursThisWeek, detail: "From recent entries", icon: Clock }, { label: "Pending Approvals", value: pending ?? 0, detail: "Submitted entries", icon: CalendarRange }, { label: "Approved Entries", value: approved ?? 0, detail: "Approved time records", icon: CheckCircle2 }]} records={records ?? []} params={params} emptyTitle="No time entries yet" emptyDescription="Create a time entry to track work or volunteer hours." getRecordTitle={(record) => `${record.entry_type === "volunteer" ? "Volunteer" : "Work"} time`} getRecordDescription={(record) => record.notes || `${record.hours ?? 0} hours`} getRecordMeta={(record) => `Started: ${new Date(record.started_at).toLocaleString()} - Ended: ${record.ended_at ? new Date(record.ended_at).toLocaleString() : "Not set"}`} getRecordStatus={(record) => record.status} />;
}
