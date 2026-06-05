type NotificationEmailInput = {
  to: string[];
  subject: string;
  preview: string;
  body: string;
};

export async function sendNotificationEmail(input: NotificationEmailInput) {
  const recipients = input.to.map((email) => email.trim()).filter(Boolean);

  if (!recipients.length) {
    return { skipped: true, reason: "no-recipients" };
  }

  if (!process.env.RESEND_API_KEY) {
    // TODO: Wire Resend here when RESEND_API_KEY and sender domain are configured.
    console.info("Notification email skipped. Configure RESEND_API_KEY to send emails.", {
      subject: input.subject,
      recipients,
      preview: input.preview,
    });
    return { skipped: true, reason: "missing-resend-api-key" };
  }

  // TODO: Send through Resend server-side. Keep this module server-only.
  console.info("Notification email prepared.", {
    subject: input.subject,
    recipients,
    preview: input.preview,
    bodyLength: input.body.length,
  });
  return { skipped: true, reason: "resend-not-wired" };
}
