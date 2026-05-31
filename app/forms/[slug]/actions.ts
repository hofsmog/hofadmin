"use server";

import { redirect } from "next/navigation";
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
    .eq("status", "active")
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

  const values = fields.map((field) => {
    const rawValue = formData.get(`field_${field.id}`);
    const value = rawValue === null ? "" : String(rawValue).trim();
    return { field, value };
  });

  const missingRequired = values.find(({ field, value }) => field.is_required && !value);
  if (missingRequired) {
    return { status: "error", message: `${missingRequired.field.label} is required.` };
  }

  const submitterEmail =
    values.find(({ field, value }) => field.field_type === "email" && value)?.value || null;

  const { data: submission, error: submissionError } = await supabase
    .from("form_submissions")
    .insert({
      organization_id: form.organization_id,
      form_id: form.id,
      submitted_by: null,
      submitter_email: submitterEmail,
      metadata: { source: "public" },
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    return { status: "error", message: submissionError?.message ?? "Submission could not be saved." };
  }

  const { error: valuesError } = await supabase.from("form_submission_values").insert(
    values.map(({ field, value }) => ({
      organization_id: form.organization_id,
      submission_id: submission.id,
      field_id: field.id,
      field_label: field.label,
      value,
    })),
  );

  if (valuesError) {
    return { status: "error", message: valuesError.message };
  }

  redirect(`/forms/${form.slug}/success`);
}
