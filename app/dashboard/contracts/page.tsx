/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, CalendarClock, FileSignature } from "lucide-react";
import { createContractAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function ContractsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const soon = addDays(60);
  const [{ count: expiring }, { count: renewal }, { count: active }, { data: records }] = await Promise.all([
    db.from("contracts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("expiration_date", soon),
    db.from("contracts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("renewal_date", soon),
    db.from("contracts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    db.from("contracts").select("id, title, category, supplier, start_date, expiration_date, renewal_date, status, notes, file_path, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  return <AdvancedRecordsPage title="Contracts" description="Store contracts, categories, owners, renewal dates, expiration dates, and reminders." createTitle="Create contract" createDescription="Add the key dates and document path for a contract." listTitle="Contracts" listDescription="Contract records and renewal dates." action={createContractAction} fields={[{ name: "title", label: "Contract Title", required: true }, { name: "category", label: "Category" }, { name: "supplier", label: "Supplier" }, { name: "startDate", label: "Start Date", type: "date" }, { name: "expirationDate", label: "Expiration Date", type: "date" }, { name: "renewalDate", label: "Renewal Date", type: "date" }, { name: "status", label: "Status", type: "select", options: ["draft", "active", "expired", "archived"] }, { name: "filePath", label: "File Path" }, { name: "notes", label: "Notes", type: "textarea" }]} stats={[{ label: "Expiring Contracts", value: expiring ?? 0, detail: "Within 60 days", icon: AlertTriangle }, { label: "Contracts Requiring Renewal", value: renewal ?? 0, detail: "Renewal date within 60 days", icon: CalendarClock }, { label: "Active Contracts", value: active ?? 0, detail: "Currently active", icon: FileSignature }]} records={records ?? []} params={params} emptyTitle="No contracts yet" emptyDescription="Create a contract record to track renewal and expiration dates." getRecordTitle={(record) => record.title} getRecordDescription={(record) => record.notes || record.supplier || "No notes"} getRecordMeta={(record) => `Supplier: ${record.supplier || "Not set"} - Expires: ${record.expiration_date || "Not set"} - Renews: ${record.renewal_date || "Not set"}`} getRecordStatus={(record) => record.status} />;
}

function addDays(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
