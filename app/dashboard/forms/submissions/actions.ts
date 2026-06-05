"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { handlingStatusLabels } from "@/lib/forms/submissions";
import type { FormSubmissionHandlingStatus, FormSubmissionReadStatus } from "@/types/database";

const allowedHandlingStatuses = new Set<FormSubmissionHandlingStatus>([
  "unhandled",
  "partially_handled",
  "handled",
  "archived",
]);
const allowedReadStatuses = new Set<FormSubmissionReadStatus>(["new", "read"]);

export async function updateSubmissionHandlingAction(formData: FormData) {
  const submissionId = String(formData.get("submissionId") || "").trim();
  const readStatus = String(formData.get("readStatus") || "read").trim() as FormSubmissionReadStatus;
  const handlingStatus = String(formData.get("handlingStatus") || "").trim() as FormSubmissionHandlingStatus;
  const handledNote = String(formData.get("handledNote") || "").trim();
  const returnTo = String(formData.get("returnTo") || "").trim();

  if (!submissionId || !allowedHandlingStatuses.has(handlingStatus) || !allowedReadStatuses.has(readStatus)) {
    redirect("/dashboard/forms/submissions?error=invalid");
  }

  const { supabase, organizationContext, user } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: existing, error: existingError } = await supabase
    .from("form_submissions")
    .select("id, organization_id, handling_status, handled_note, handled_at, form_id")
    .eq("id", submissionId)
    .eq("organization_id", organizationId)
    .single();

  if (existingError || !existing) {
    redirect("/dashboard/forms/submissions?error=not-found");
  }

  const statusChanged = existing.handling_status !== handlingStatus;
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("form_submissions")
    .update({
      handling_status: handlingStatus,
      read_status: readStatus,
      handled_note: handledNote || null,
      handled_by: user.id,
      handled_at: statusChanged || handledNote !== (existing.handled_note ?? "") ? now : existing.handled_at,
    })
    .eq("id", submissionId)
    .eq("organization_id", organizationId);

  if (updateError) {
    redirect(`/dashboard/forms/submissions/${submissionId}?error=update`);
  }

  if (statusChanged) {
    await recordActivityEvent({
      supabase,
      organizationId,
      actorId: user.id,
      type: "form_submission_handling_changed",
      title: "Response status updated",
      description: `Handling status changed to ${handlingStatusLabels[handlingStatus]}.`,
      metadata: { submission_id: submissionId, form_id: existing.form_id, handling_status: handlingStatus },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/submissions");
  revalidatePath(`/dashboard/forms/submissions/${submissionId}`);
  redirect(returnTo || `/dashboard/forms/submissions/${submissionId}?updated=1`);
}

export async function updateSubmissionStatusAction(formData: FormData) {
  const submissionId = String(formData.get("submissionId") || "").trim();
  const readStatus = String(formData.get("readStatus") || "read").trim() as FormSubmissionReadStatus;
  const handlingStatus = String(formData.get("handlingStatus") || "unhandled").trim() as FormSubmissionHandlingStatus;
  const returnTo = String(formData.get("returnTo") || "/dashboard/forms/submissions").trim();

  if (!submissionId || !allowedReadStatuses.has(readStatus) || !allowedHandlingStatuses.has(handlingStatus)) {
    redirect("/dashboard/forms/submissions?error=invalid");
  }

  const { supabase, organizationContext, user } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: existing } = await supabase
    .from("form_submissions")
    .select("id, form_id, read_status, handling_status")
    .eq("id", submissionId)
    .eq("organization_id", organizationId)
    .single();

  if (!existing) {
    redirect("/dashboard/forms/submissions?error=not-found");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("form_submissions")
    .update({
      read_status: readStatus,
      handling_status: handlingStatus,
      handled_by: user.id,
      handled_at: existing.handling_status !== handlingStatus ? now : undefined,
    })
    .eq("id", submissionId)
    .eq("organization_id", organizationId);

  if (error) {
    redirect("/dashboard/forms/submissions?error=update");
  }

  if (existing.handling_status !== handlingStatus) {
    await recordActivityEvent({
      supabase,
      organizationId,
      actorId: user.id,
      type: "form_submission_handling_changed",
      title: "Response status updated",
      description: `Handling status changed to ${handlingStatusLabels[handlingStatus]}.`,
      metadata: { submission_id: submissionId, form_id: existing.form_id, handling_status: handlingStatus },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/submissions");
  revalidatePath(`/dashboard/forms/submissions/${submissionId}`);
  redirect(returnTo);
}

export async function addSubmissionNoteAction(formData: FormData) {
  const submissionId = String(formData.get("submissionId") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!submissionId || !note) {
    redirect(`/dashboard/forms/submissions/${submissionId}?error=note`);
  }

  const { supabase, organizationContext, user } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const { data: submission } = await supabase
    .from("form_submissions")
    .select("id")
    .eq("id", submissionId)
    .eq("organization_id", organizationId)
    .single();

  if (!submission) {
    redirect("/dashboard/forms/submissions?error=not-found");
  }

  const { error } = await supabase.from("submission_notes").insert({
    organization_id: organizationId,
    submission_id: submissionId,
    note: note.slice(0, 2000),
    created_by: user.id,
  });

  if (error) {
    redirect(`/dashboard/forms/submissions/${submissionId}?error=note`);
  }

  revalidatePath(`/dashboard/forms/submissions/${submissionId}`);
  redirect(`/dashboard/forms/submissions/${submissionId}?updated=1`);
}
