/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, CheckCircle2, GraduationCap } from "lucide-react";
import { createTrainingAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function TrainingPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [{ count: expiring }, { count: overdue }, { count: completedThisMonth }, { data: records }] = await Promise.all([
    db.from("training_records").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("expires_at", today).lte("expires_at", addDays(60)),
    db.from("training_records").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "completed").lt("due_date", today),
    db.from("training_records").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "completed").gte("completed_at", monthStart.toISOString()),
    db.from("training_records").select("id, title, description, status, due_date, completed_at, expires_at, notes, members(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdvancedRecordsPage
      title="Training"
      description="Track assigned training, completion, certification uploads, expiration dates, and renewal needs."
      createTitle="Create training record"
      createDescription="Assign a course or certification to a member or team."
      listTitle="Training records"
      listDescription="Review progress, due dates, and certification expiration."
      action={createTrainingAction}
      fields={[
        { name: "title", label: "Training Title", required: true, placeholder: "Fire Safety" },
        { name: "description", label: "Description", type: "textarea", placeholder: "What this training covers" },
        { name: "status", label: "Status", type: "select", options: ["not_started", "in_progress", "completed", "expired"] },
        { name: "dueDate", label: "Due Date", type: "date" },
        { name: "expiresAt", label: "Certification Expiration", type: "date" },
        { name: "certificationFilePath", label: "Certification File Path", placeholder: "organizations/.../certificate.pdf" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Optional training notes" },
      ]}
      stats={[
        { label: "Expiring Certifications", value: expiring ?? 0, detail: "Within the next 60 days", icon: AlertTriangle },
        { label: "Overdue Training", value: overdue ?? 0, detail: "Due date has passed", icon: GraduationCap },
        { label: "Completed Training This Month", value: completedThisMonth ?? 0, detail: "Completed since month start", icon: CheckCircle2 },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No training records yet"
      emptyDescription="Create a training record to start tracking completion and renewal needs."
      getRecordTitle={(record) => record.title}
      getRecordDescription={(record) => record.description || record.notes || "No description"}
      getRecordMeta={(record) => `Member: ${record.members?.name || "Unassigned"} - Due: ${record.due_date || "Not set"} - Expires: ${record.expires_at || "Not set"}`}
      getRecordStatus={(record) => record.status}
    />
  );
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
