import "server-only";

import { sendEmail } from "@/lib/email/send-email";

type NotificationEmailInput = {
  to: string[];
  subject: string;
  preview: string;
  body: string;
  organizationId: string;
};

export async function sendNotificationEmail(input: NotificationEmailInput) {
  return sendEmail({
    to: input.to,
    subject: input.subject,
    html: `<p>${escapeHtml(input.preview)}</p><p>${escapeHtml(input.body)}</p>`,
    text: [input.preview, "", input.body].join("\n"),
    organizationId: input.organizationId,
    eventType: "test_email",
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
