import "server-only";

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type EmailEventType =
  | "team_invitation"
  | "new_form_response"
  | "loan_due_tomorrow"
  | "loan_overdue"
  | "new_member_added"
  | "new_fault_report"
  | "booking_request"
  | "policy_acknowledgement_reminder"
  | "contract_expiration_reminder"
  | "training_expiration_reminder"
  | "test_email";

export type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  organizationId: string;
  eventType: EmailEventType;
  supabase?: SupabaseClient<Database>;
};

export type SendEmailResult = {
  success: boolean;
  message: string;
  providerMessageIds?: string[];
  error?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = normalizeRecipients(input.to);

  if (!recipients.length) {
    console.error("[email] No recipient email addresses were provided.", { eventType: input.eventType, organizationId: input.organizationId });
    return { success: false, message: "No recipient email addresses were provided.", error: "no_recipients" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.FROM_EMAIL;
  const fromName = process.env.EMAIL_FROM_NAME || "HofAdmin";

  if (!apiKey) {
    console.error("[email] Missing RESEND_API_KEY.", { eventType: input.eventType, organizationId: input.organizationId });
    await logMany(input, recipients, "failed", null, "RESEND_API_KEY is not configured.");
    return { success: false, message: "Email sending is not configured. Add RESEND_API_KEY in the server environment.", error: "missing_resend_api_key" };
  }

  if (!fromAddress || !fromAddress.includes("@")) {
    console.error("[email] Missing or invalid EMAIL_FROM_ADDRESS / FROM_EMAIL.", {
      eventType: input.eventType,
      organizationId: input.organizationId,
      fromAddressConfigured: Boolean(fromAddress),
    });
    await logMany(input, recipients, "failed", null, "EMAIL_FROM_ADDRESS / FROM_EMAIL is missing or invalid.");
    return { success: false, message: "Email sender is not configured. Add a verified EMAIL_FROM_ADDRESS or FROM_EMAIL.", error: "invalid_from_address" };
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (response.error) {
      const errorMessage = response.error.message || "Resend returned an error.";
      console.error("[email] Resend rejected email.", {
        eventType: input.eventType,
        organizationId: input.organizationId,
        error: errorMessage,
      });
      await logMany(input, recipients, "failed", null, errorMessage);
      return { success: false, message: errorMessage, error: "provider_error" };
    }

    const messageId = response.data?.id ?? null;
    await logMany(input, recipients, "sent", messageId, null);
    return {
      success: true,
      message: "Email sent successfully.",
      providerMessageIds: messageId ? [messageId] : [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email provider request failed.";
    console.error("[email] Email provider request failed.", {
      eventType: input.eventType,
      organizationId: input.organizationId,
      error: message,
    });
    await logMany(input, recipients, "failed", null, message);
    return { success: false, message, error: "send_failed" };
  }
}

export function getEmailEnvironmentStatus() {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY);
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.FROM_EMAIL;
  const hasFromAddress = Boolean(fromAddress && fromAddress.includes("@"));
  const hasAppUrl = Boolean(process.env.APP_URL);

  return {
    resendApiKeyConfigured: hasApiKey,
    fromAddressConfigured: hasFromAddress,
    appUrlConfigured: hasAppUrl,
    ready: hasApiKey && hasFromAddress && hasAppUrl,
    fromName: process.env.EMAIL_FROM_NAME || "HofAdmin",
    fromAddress: fromAddress || null,
    appUrl: process.env.APP_URL || null,
  };
}

function normalizeRecipients(recipients: string[]) {
  return Array.from(
    new Set(
      recipients
        .flatMap((recipient) => recipient.split(","))
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.includes("@")),
    ),
  ).slice(0, 50);
}

async function logMany(
  input: SendEmailInput,
  recipients: string[],
  status: "sent" | "failed",
  providerMessageId: string | null,
  errorMessage: string | null,
) {
  await Promise.all(
    recipients.map((recipient) =>
      logEmailDelivery({
        supabase: input.supabase,
        organizationId: input.organizationId,
        recipientEmail: recipient,
        subject: input.subject,
        eventType: input.eventType,
        status,
        providerMessageId,
        errorMessage,
      }),
    ),
  );
}

async function logEmailDelivery({
  supabase,
  organizationId,
  recipientEmail,
  subject,
  eventType,
  status,
  providerMessageId,
  errorMessage,
}: {
  supabase?: SupabaseClient<Database>;
  organizationId: string;
  recipientEmail: string;
  subject: string;
  eventType: EmailEventType;
  status: "sent" | "failed";
  providerMessageId: string | null;
  errorMessage: string | null;
}) {
  const client = supabase ?? await createClient();

  if (!client) {
    return;
  }

  const db = client as unknown as SupabaseClient;
  await db.rpc("log_email_delivery", {
    p_organization_id: organizationId,
    p_recipient_email: recipientEmail,
    p_subject: subject,
    p_event_type: eventType,
    p_status: status,
    p_provider_message_id: providerMessageId,
    p_error_message: errorMessage,
  });
}
