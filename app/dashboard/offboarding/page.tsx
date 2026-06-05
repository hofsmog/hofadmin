/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, CheckCircle2, UserMinus } from "lucide-react";
import { createOffboardingAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function OffboardingPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: active }, { count: missingAssets }, { count: outstandingKeys }, { data: records }] = await Promise.all([
    db.from("offboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["pending", "in_progress"]),
    db.from("offboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gt("missing_assets_count", 0),
    db.from("offboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gt("outstanding_keys_count", 0),
    db.from("offboarding_processes").select("id, name, role_title, department, departure_date, status, missing_assets_count, outstanding_keys_count, notes, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdvancedRecordsPage
      title="Offboarding"
      description="Manage departures, returned assets, returned keys, checklist completion, and final sign-off."
      createTitle="Create offboarding process"
      createDescription="Start a simple departure workflow with return tracking."
      listTitle="Offboarding processes"
      listDescription="Follow outstanding returns and completion status."
      action={createOffboardingAction}
      fields={[
        { name: "name", label: "Name", required: true, placeholder: "Alex Johnson" },
        { name: "roleTitle", label: "Role", placeholder: "Teacher, Coach, Volunteer" },
        { name: "department", label: "Department", placeholder: "IT, Operations, Sports" },
        { name: "departureDate", label: "Departure Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["pending", "in_progress", "completed"] },
        { name: "missingAssetsCount", label: "Missing Assets", type: "number", placeholder: "0" },
        { name: "outstandingKeysCount", label: "Outstanding Keys", type: "number", placeholder: "0" },
        { name: "checklist", label: "Checklist", type: "textarea", placeholder: "Return laptop\nReturn keys\nConfirm access removal" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Optional internal notes" },
      ]}
      stats={[
        { label: "Active Offboarding Processes", value: active ?? 0, detail: "Pending or in progress", icon: UserMinus },
        { label: "Missing Assets", value: missingAssets ?? 0, detail: "Processes with missing assets", icon: AlertTriangle },
        { label: "Outstanding Returns", value: outstandingKeys ?? 0, detail: "Processes with outstanding keys", icon: CheckCircle2 },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No offboarding processes yet"
      emptyDescription="Create a process when someone leaves and needs to return assets or keys."
      getRecordTitle={(record) => record.name}
      getRecordDescription={(record) => `${record.role_title || "No role"}${record.department ? ` in ${record.department}` : ""}`}
      getRecordMeta={(record) => `Departure: ${record.departure_date || "Not set"} - Missing assets: ${record.missing_assets_count ?? 0} - Outstanding keys: ${record.outstanding_keys_count ?? 0}`}
      getRecordStatus={(record) => record.status}
    />
  );
}
