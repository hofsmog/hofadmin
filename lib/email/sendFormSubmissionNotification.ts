import "server-only";

import { sendEmail } from "@/lib/email/send-email";

type NotificationValue = {
  field_label: string;
  value: string | null;
};

export async function sendFormSubmissionNotification({
  to,
  organizationId,
  formTitle,
  respondentName,
  submittedAt,
  submissionUrl,
  values,
}: {
  to: string[];
  organizationId: string;
  formTitle: string;
  respondentName: string;
  submittedAt: string;
  submissionUrl: string;
  values: NotificationValue[];
}) {
  const summary = values
    .slice(0, 8)
    .map((value) => `${value.field_label}: ${value.value || "No value"}`)
    .join("\n");

  return sendEmail({
    to,
    subject: `New submission: ${formTitle}`,
    html: `
      <h1>New form response</h1>
      <p><strong>Form:</strong> ${escapeHtml(formTitle)}</p>
      <p><strong>Respondent:</strong> ${escapeHtml(respondentName)}</p>
      <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
      <pre>${escapeHtml(summary || "No field values captured.")}</pre>
      <p><a href="${escapeHtml(submissionUrl)}">Open submission</a></p>
    `,
    text: [
      `Form: ${formTitle}`,
      `Respondent: ${respondentName}`,
      `Submitted: ${submittedAt}`,
      "",
      "Summary:",
      summary || "No field values captured.",
      "",
      `Open submission: ${submissionUrl}`,
    ].join("\n"),
    organizationId,
    eventType: "new_form_response",
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
