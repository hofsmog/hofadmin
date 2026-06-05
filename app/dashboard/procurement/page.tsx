/* eslint-disable @typescript-eslint/no-explicit-any */

import { CheckCircle2, PackageCheck, Receipt } from "lucide-react";
import { createProcurementAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function ProcurementPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: pending }, { count: approved }, { count: outstanding }, { data: records }] = await Promise.all([
    db.from("procurement_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "submitted"),
    db.from("procurement_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "approved"),
    db.from("procurement_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "ordered"),
    db.from("procurement_requests").select("id, title, description, supplier, cost_estimate, priority, status, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  return <AdvancedRecordsPage title="Procurement" description="Manage purchase requests, approvals, suppliers, estimates, orders, and linked assets." createTitle="Create purchase request" createDescription="Capture the request, supplier, estimate, and priority." listTitle="Purchase requests" listDescription="Track approvals and order status." action={createProcurementAction} fields={[{ name: "title", label: "Request Title", required: true }, { name: "description", label: "Description", type: "textarea" }, { name: "supplier", label: "Supplier" }, { name: "costEstimate", label: "Cost Estimate", type: "number" }, { name: "priority", label: "Priority", type: "select", options: ["low", "normal", "high", "urgent"] }, { name: "status", label: "Status", type: "select", options: ["draft", "submitted", "approved", "ordered", "received", "rejected"] }]} stats={[{ label: "Pending Requests", value: pending ?? 0, detail: "Submitted for approval", icon: Receipt }, { label: "Approved Purchases", value: approved ?? 0, detail: "Approved requests", icon: CheckCircle2 }, { label: "Outstanding Orders", value: outstanding ?? 0, detail: "Ordered but not received", icon: PackageCheck }]} records={records ?? []} params={params} emptyTitle="No purchase requests yet" emptyDescription="Create a request to start tracking procurement." getRecordTitle={(record) => record.title} getRecordDescription={(record) => record.description || record.supplier || "No description"} getRecordMeta={(record) => `Supplier: ${record.supplier || "Not set"} - Estimate: ${record.cost_estimate ?? "Not set"} - Priority: ${record.priority}`} getRecordStatus={(record) => record.status} />;
}
