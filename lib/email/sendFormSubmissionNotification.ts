type NotificationValue = {
  field_label: string;
  value: string | null;
};

export async function sendFormSubmissionNotification({
  to,
  formTitle,
  respondentName,
  submittedAt,
  submissionUrl,
  values,
}: {
  to: string[];
  formTitle: string;
  respondentName: string;
  submittedAt: string;
  submissionUrl: string;
  values: NotificationValue[];
}) {
  const recipients = to.map((email) => email.trim()).filter(Boolean);

  if (!recipients.length) {
    return { skipped: true, reason: "No notification recipients configured." };
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // TODO: Add RESEND_API_KEY to the server environment to enable real email delivery.
    console.info("Form submission notification skipped: RESEND_API_KEY is not configured.", {
      recipients,
      formTitle,
      respondentName,
      submissionUrl,
    });
    return { skipped: true, reason: "RESEND_API_KEY is not configured." };
  }

  const summary = values
    .slice(0, 8)
    .map((value) => `${value.field_label}: ${value.value || "No value"}`)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "HofAdmin <notifications@hofadmin.com>",
      to: recipients,
      subject: `New submission: ${formTitle}`,
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
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email failed with status ${response.status}.`);
  }

  return { skipped: false };
}
