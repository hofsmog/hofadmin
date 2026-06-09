import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { recordActivityEvent } from "@/lib/activity";
import { sendEmail, type EmailEventType } from "@/lib/email/send-email";
import type { ActivityEventType, Database, Json } from "@/types/database";

type NotificationEventType = Exclude<EmailEventType, "team_invitation" | "test_email">;

const preferenceColumns: Record<NotificationEventType, string> = {
  new_form_response: "notify_new_form_response",
  loan_due_tomorrow: "notify_loan_due_tomorrow",
  loan_overdue: "notify_loan_overdue",
  new_member_added: "notify_new_member_added",
  new_fault_report: "notify_new_fault_report",
  booking_request: "notify_booking_request",
  policy_acknowledgement_reminder: "notify_policy_acknowledgement_reminder",
  contract_expiration_reminder: "notify_contract_expiration_reminder",
  training_expiration_reminder: "notify_training_expiration_reminder",
};

export async function sendNotificationEmail({
  supabase,
  organizationId,
  eventType,
  subject,
  preview,
  body,
  actionUrl,
  fallbackRecipients = [],
  activity,
}: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  eventType: NotificationEventType;
  subject: string;
  preview: string;
  body: string;
  actionUrl?: string | null;
  fallbackRecipients?: string[];
  activity?: {
    type: ActivityEventType;
    title: string;
    description?: string | null;
    actorId: string;
    metadata?: Record<string, unknown>;
  };
}) {
  const db = supabase as unknown as SupabaseClient;
  const { data: preferences } = await db
    .from("organization_notification_preferences")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const preferenceColumn = preferenceColumns[eventType];
  const preferenceRecord = preferences as Record<string, unknown> | null;
  const enabled = preferences?.enable_email_notifications !== false && preferenceRecord?.[preferenceColumn] !== false;
  const recipients = preferences?.notification_emails?.length ? preferences.notification_emails : fallbackRecipients;

  if (!enabled) {
    return { success: false, message: "Email notification is disabled for this event.", error: "disabled" };
  }

  const result = await sendEmail({
    to: recipients,
    subject,
    html: buildHtml({ subject, preview, body, actionUrl }),
    text: buildText({ subject, preview, body, actionUrl }),
    organizationId,
    eventType,
    supabase,
  });

  if (result.success && activity) {
    await recordActivityEvent({
      supabase,
      organizationId,
      type: activity.type,
      title: activity.title,
      description: activity.description ?? null,
      actorId: activity.actorId,
      metadata: (activity.metadata ?? {}) as Json,
    }).catch(() => null);
  }

  return result;
}

function buildHtml({ subject, preview, body, actionUrl }: { subject: string; preview: string; body: string; actionUrl?: string | null }) {
  const paragraphs = body
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;color:#3f3f46;line-height:1.6">${escapeHtml(line)}</p>`)
    .join("");
  const button = actionUrl
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;border-radius:10px;background:#18181b;color:#fff;padding:10px 16px;text-decoration:none;font-weight:600">Open in HofAdmin</a></p>`
    : "";

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f4f4f5;padding:24px">
      <div style="max-width:600px;margin:0 auto;border:1px solid #e4e4e7;border-radius:16px;background:#fff;padding:24px">
        <p style="margin:0 0 8px;color:#71717a;font-size:13px">HofAdmin notification</p>
        <h1 style="margin:0 0 12px;color:#18181b;font-size:22px;line-height:1.3">${escapeHtml(subject)}</h1>
        <p style="margin:0 0 20px;color:#52525b">${escapeHtml(preview)}</p>
        ${paragraphs}
        ${button}
      </div>
    </div>
  `;
}

function buildText({ subject, preview, body, actionUrl }: { subject: string; preview: string; body: string; actionUrl?: string | null }) {
  return [subject, preview, "", body, actionUrl ? `Open in HofAdmin: ${actionUrl}` : ""].filter(Boolean).join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
