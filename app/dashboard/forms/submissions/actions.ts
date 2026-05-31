"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { handlingStatusLabels } from "@/lib/forms/submissions";
import type { FormSubmissionHandlingStatus } from "@/types/database";

const allowedHandlingStatuses = new Set<FormSubmissionHandlingStatus>([
  "unhandled",
  "partially_handled",
  "handled",
  "archived",
]);

export async function updateSubmissionHandlingAction(formData: FormData) {
  const submissionId = String(formData.get("submissionId") || "").trim();
  const handlingStatus = String(formData.get("handlingStatus") || "").trim() as FormSubmissionHandlingStatus;
  const handledNote = String(formData.get("handledNote") || "").trim();

  if (!submissionId || !allowedHandlingStatuses.has(handlingStatus)) {
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
      title: "Submission handling updated",
      description: `Handling status changed to ${handlingStatusLabels[handlingStatus]}.`,
      metadata: { submission_id: submissionId, form_id: existing.form_id, handling_status: handlingStatus },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/submissions");
  revalidatePath(`/dashboard/forms/submissions/${submissionId}`);
  redirect(`/dashboard/forms/submissions/${submissionId}?updated=1`);
}
