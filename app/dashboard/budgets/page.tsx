/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, PiggyBank, TrendingUp } from "lucide-react";
import { createBudgetAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function BudgetsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const { data: records } = await db.from("budget_categories").select("id, name, category, planned_amount, actual_amount, notes, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50);
  const totals = (records ?? []).reduce((sum: { planned: number; actual: number; over: number }, record: any) => {
    const planned = Number(record.planned_amount ?? 0);
    const actual = Number(record.actual_amount ?? 0);
    return { planned: sum.planned + planned, actual: sum.actual + actual, over: sum.over + (actual > planned ? 1 : 0) };
  }, { planned: 0, actual: 0, over: 0 });

  return (
    <AdvancedRecordsPage
      title="Budgets"
      description="Track planned amounts, actual costs, variance, and lightweight budget categories."
      createTitle="Create budget category"
      createDescription="This is lightweight planning, not accounting software."
      listTitle="Budget categories"
      listDescription="Compare planned and actual amounts at a glance."
      action={createBudgetAction}
      fields={[
        { name: "name", label: "Name", required: true, placeholder: "Equipment" },
        { name: "category", label: "Category", placeholder: "Operations, Training, Events" },
        { name: "plannedAmount", label: "Planned Amount", type: "number", placeholder: "10000" },
        { name: "actualAmount", label: "Actual Amount", type: "number", placeholder: "8500" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Optional budget notes" },
      ]}
      stats={[
        { label: "Budget Overview", value: `${totals.actual}/${totals.planned}`, detail: "Actual compared with planned", icon: PiggyBank },
        { label: "Over Budget Categories", value: totals.over, detail: "Actual is above planned", icon: AlertTriangle },
        { label: "Upcoming Planned Costs", value: totals.planned, detail: "Total planned amount", icon: TrendingUp },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No budget categories yet"
      emptyDescription="Create a category to start tracking planned and actual costs."
      getRecordTitle={(record) => record.name}
      getRecordDescription={(record) => record.notes || record.category || "No notes"}
      getRecordMeta={(record) => `Planned: ${record.planned_amount ?? 0} - Actual: ${record.actual_amount ?? 0} - Variance: ${Number(record.planned_amount ?? 0) - Number(record.actual_amount ?? 0)}`}
      getRecordStatus={(record) => Number(record.actual_amount ?? 0) > Number(record.planned_amount ?? 0) ? "over_budget" : "on_track"}
    />
  );
}
