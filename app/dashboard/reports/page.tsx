/* eslint-disable @typescript-eslint/no-explicit-any */

import { BarChart3, Download, Eye } from "lucide-react";
import { createReportAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const { data: records } = await db.from("reports").select("id, name, description, export_format, view_count, last_generated_at, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50);
  const totalViews = (records ?? []).reduce((sum: number, record: any) => sum + Number(record.view_count ?? 0), 0);
  return <AdvancedRecordsPage title="Reporting" description="Create saved reports, filters, export preferences, and organization statistics." createTitle="Create report" createDescription="Save a report definition and preferred export format." listTitle="Saved reports" listDescription="Saved report definitions and generation history." action={createReportAction} fields={[{ name: "name", label: "Report Name", required: true }, { name: "description", label: "Description", type: "textarea" }, { name: "exportFormat", label: "Export Format", type: "select", options: ["csv", "excel", "pdf"] }]} stats={[{ label: "Report Usage", value: records?.length ?? 0, detail: "Saved reports", icon: BarChart3 }, { label: "Most Viewed Reports", value: totalViews, detail: "Total recorded views", icon: Eye }, { label: "Exports", value: records?.length ?? 0, detail: "CSV, Excel, or PDF preference", icon: Download }]} records={records ?? []} params={params} emptyTitle="No reports yet" emptyDescription="Create a saved report to prepare exports and organization statistics." getRecordTitle={(record) => record.name} getRecordDescription={(record) => record.description || "No description"} getRecordMeta={(record) => `Format: ${record.export_format.toUpperCase()} - Views: ${record.view_count ?? 0} - Last generated: ${record.last_generated_at ? new Date(record.last_generated_at).toLocaleString() : "Not generated"}`} getRecordStatus={(record) => record.export_format} />;
}
