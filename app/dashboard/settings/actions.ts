"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";

export async function updateNotificationPreferencesAction(formData: FormData) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;

  if (!canManageOrganization(activeMembership.role)) {
    redirect("/dashboard/settings?notifications=denied");
  }

  const emails = String(formData.get("notificationEmails") || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);

  const invalidEmail = emails.find((email) => !email.includes("@"));
  if (invalidEmail) {
    redirect("/dashboard/settings?notifications=invalid-email");
  }

  const emailNotificationsEnabled = formData.get("enableEmailNotifications") === "on";
  const { error } = await supabase.from("organization_notification_preferences").upsert({
    organization_id: activeOrganization.id,
    enable_email_notifications: emailNotificationsEnabled,
    notify_new_form_response: formData.get("notifyNewFormResponse") === "on",
    notify_loan_due_tomorrow: formData.get("notifyLoanDueTomorrow") === "on",
    notify_loan_overdue: formData.get("notifyLoanOverdue") === "on",
    notify_new_member_added: formData.get("notifyNewMemberAdded") === "on",
    notify_new_fault_report: formData.get("notifyNewFaultReport") === "on",
    notify_booking_request: formData.get("notifyBookingRequest") === "on",
    notify_policy_acknowledgement_reminder: formData.get("notifyPolicyAcknowledgementReminder") === "on",
    notify_contract_expiration_reminder: formData.get("notifyContractExpirationReminder") === "on",
    notify_training_expiration_reminder: formData.get("notifyTrainingExpirationReminder") === "on",
    notification_emails: emails,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect("/dashboard/settings?notifications=error");
  }

  const { error: organizationError } = await supabase
    .from("organizations")
    .update({
      email_notifications_enabled: emailNotificationsEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", activeOrganization.id);

  if (organizationError) {
    redirect("/dashboard/settings?notifications=error");
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?notifications=saved");
}
