"use server";

import { redirect } from "next/navigation";
import { getRespondentName } from "@/lib/forms/submissions";
import { sendNotificationEmail } from "@/lib/notifications/send-notification-email";
import { createClient } from "@/lib/supabase/server";

export type PublicFormState = {
  status: "idle" | "error";
  message: string;
};

export async function submitPublicFormAction(
  _state: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const slug = String(formData.get("formSlug") || "").trim();
  const supabase = await createClient();

  if (!supabase) {
    return { status: "error", message: "Forms are not configured for this environment." };
  }

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (formError || !form) {
    return { status: "error", message: "This form is no longer available." };
  }

  const { data: fields, error: fieldsError } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", form.id)
    .eq("organization_id", form.organization_id)
    .order("sort_order", { ascending: true });

  if (fieldsError || !fields?.length) {
    return { status: "error", message: "This form has no fields available." };
  }

  const isAnonymousSurvey = form.form_type === "survey" && form.anonymous_responses;
  const values = fields.map((field) => {
    const fieldName = `field_${field.id}`;
    const rawValues = formData.getAll(fieldName).map((value) => String(value).trim()).filter(Boolean);
    const rawValue = field.field_type === "checkbox" && rawValues.length > 1 ? rawValues.join(", ") : formData.get(fieldName);
    const value = isAnonymousSurvey && isPersonalField(field.field_type, field.label)
      ? ""
      : rawValues.length > 1 ? rawValues.join(", ") : rawValue === null ? "" : String(rawValue).trim();
    return { field, value };
  });

  const missingRequired = values.find(({ field, value }) => field.is_required && !value && !(isAnonymousSurvey && isPersonalField(field.field_type, field.label)));
  if (missingRequired) {
    return { status: "error", message: `${missingRequired.field.label} is required.` };
  }

  const submitterEmail =
    isAnonymousSurvey
      ? null
      : values.find(({ field, value }) => field.field_type === "email" && value)?.value || null;

  const submissionId = crypto.randomUUID();
  const { error: submissionError } = await supabase
    .from("form_submissions")
    .insert({
      id: submissionId,
      organization_id: form.organization_id,
      form_id: form.id,
      submitted_by: null,
      submitter_email: submitterEmail,
      read_status: "new",
      handling_status: "unhandled",
      handled_note: null,
      handled_by: null,
      handled_at: null,
      metadata: { source: "public", anonymous: isAnonymousSurvey },
    });

  if (submissionError) {
    return { status: "error", message: submissionError?.message ?? "Submission could not be saved." };
  }

  const { error: valuesError } = await supabase.from("form_submission_values").insert(
    values.map(({ field, value }) => ({
      organization_id: form.organization_id,
      submission_id: submissionId,
      field_id: field.id,
      field_label: field.label,
      value,
    })),
  );

  if (valuesError) {
    return { status: "error", message: valuesError.message };
  }

  if (form.enable_email_notifications) {
    const appUrl = process.env.APP_URL ?? "https://hofadmin.vercel.app";
    const submissionUrl = `${appUrl}/dashboard/forms/submissions/${submissionId}`;
    const notificationValues = values.map(({ field, value }) => ({
      field_label: field.label,
      value,
    }));
    const respondentName = getRespondentName(notificationValues);
    const summary = notificationValues
      .slice(0, 8)
      .map((value) => `${value.field_label}: ${value.value || "No value"}`)
      .join("\n");

    await sendNotificationEmail({
      supabase,
      organizationId: form.organization_id,
      eventType: "new_form_response",
      subject: `New submission: ${form.title}`,
      preview: `${respondentName} submitted ${form.title}.`,
      body: [
        `Form: ${form.title}`,
        `Respondent: ${respondentName}`,
        `Submitted: ${new Date().toISOString()}`,
        "",
        "Summary:",
        summary || "No field values captured.",
      ].join("\n"),
      actionUrl: submissionUrl,
      fallbackRecipients: form.notification_emails ?? [],
    }).catch((error) => {
      console.error("Form submission notification failed", error);
    });
  }

  redirect(`/forms/${form.slug}/success`);
}

function isPersonalField(fieldType: string, label: string) {
  const normalized = label.trim().toLowerCase();
  return (
    fieldType === "email" ||
    fieldType === "phone" ||
    ["name", "full name", "namn", "förnamn", "fornamn", "efternamn", "telefon", "phone", "e-post", "email"].some((token) => normalized.includes(token))
  );
}
