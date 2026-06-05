/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, CalendarClock, ShieldAlert } from "lucide-react";
import { createRiskAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function RisksPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: open }, { count: reviews }, { data: records }] = await Promise.all([
    db.from("risks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "open"),
    db.from("risks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("review_date", today),
    db.from("risks").select("id, title, category, impact_level, probability_level, mitigation_plan, review_date, status, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  const highRisk = (records ?? []).filter((record: any) => record.impact_level === "high" || record.probability_level === "high").length;
  return <AdvancedRecordsPage title="Risk Management" description="Maintain a risk register with impact, probability, mitigation plans, owners, and reviews." createTitle="Create risk" createDescription="Record the risk, impact, probability, mitigation, and review date." listTitle="Risk register" listDescription="Open, mitigated, and closed risks." action={createRiskAction} fields={[{ name: "title", label: "Risk Title", required: true }, { name: "category", label: "Category" }, { name: "impactLevel", label: "Impact Level", type: "select", options: ["low", "medium", "high"] }, { name: "probabilityLevel", label: "Probability Level", type: "select", options: ["low", "medium", "high"] }, { name: "mitigationPlan", label: "Mitigation Plan", type: "textarea" }, { name: "reviewDate", label: "Review Date", type: "date" }, { name: "status", label: "Status", type: "select", options: ["open", "mitigated", "closed"] }]} stats={[{ label: "Open Risks", value: open ?? 0, detail: "Currently open", icon: ShieldAlert }, { label: "High-Risk Items", value: highRisk, detail: "High impact or probability", icon: AlertTriangle }, { label: "Reviews Due", value: reviews ?? 0, detail: "Review date due", icon: CalendarClock }]} records={records ?? []} params={params} emptyTitle="No risks yet" emptyDescription="Create a risk to start building your risk register." getRecordTitle={(record) => record.title} getRecordDescription={(record) => record.mitigation_plan || record.category || "No mitigation plan"} getRecordMeta={(record) => `Impact: ${record.impact_level} - Probability: ${record.probability_level} - Review: ${record.review_date || "Not set"}`} getRecordStatus={(record) => record.status} />;
}
