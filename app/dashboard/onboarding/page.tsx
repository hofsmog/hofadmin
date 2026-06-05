/* eslint-disable @typescript-eslint/no-explicit-any */

import { CheckCircle2, ClipboardList, UserPlus } from "lucide-react";
import { createOnboardingAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function OnboardingPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: active }, { count: pending }, { count: completed }, { data: records }] = await Promise.all([
    db.from("onboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["pending", "in_progress"]),
    db.from("onboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending"),
    db.from("onboarding_processes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "completed"),
    db.from("onboarding_processes").select("id, name, role_title, department, start_date, location, status, progress, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdvancedRecordsPage
      title="Onboarding"
      description="Guide new employees, staff, volunteers, or members through tasks, assets, policies, and training."
      createTitle="Create onboarding process"
      createDescription="Start with the person, start date, and a simple checklist."
      listTitle="Onboarding processes"
      listDescription="Track active and completed onboarding workflows."
      action={createOnboardingAction}
      fields={[
        { name: "name", label: "Name", required: true, placeholder: "Alex Johnson" },
        { name: "roleTitle", label: "Role", placeholder: "Teacher, Coach, Volunteer" },
        { name: "department", label: "Department", placeholder: "IT, Operations, Sports" },
        { name: "startDate", label: "Start Date", type: "date" },
        { name: "location", label: "Location", placeholder: "Main office" },
        { name: "status", label: "Status", type: "select", options: ["draft", "pending", "in_progress", "completed"] },
        { name: "progress", label: "Progress", type: "number", placeholder: "0" },
        { name: "checklist", label: "Checklist", type: "textarea", placeholder: "Assign equipment\nReview policies\nComplete training" },
      ]}
      stats={[
        { label: "Active Onboarding Processes", value: active ?? 0, detail: "Pending or in progress", icon: UserPlus },
        { label: "Pending Tasks", value: pending ?? 0, detail: "Waiting to start", icon: ClipboardList },
        { label: "Completed", value: completed ?? 0, detail: "Finished onboarding", icon: CheckCircle2 },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No onboarding processes yet"
      emptyDescription="Create the first onboarding process to guide a new person through setup."
      getRecordTitle={(record) => record.name}
      getRecordDescription={(record) => `${record.role_title || "No role"}${record.department ? ` in ${record.department}` : ""}`}
      getRecordMeta={(record) => `Start date: ${record.start_date || "Not set"} - Progress: ${record.progress ?? 0}% - ${record.location || "No location"}`}
      getRecordStatus={(record) => record.status}
    />
  );
}
