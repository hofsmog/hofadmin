"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { FormCornerRadius, FormFieldType, FormFontStyle, FormLayout, FormStatus } from "@/types/database";

const validStatuses = new Set<FormStatus>(["draft", "active", "archived"]);
const validFontStyles = new Set<FormFontStyle>(["default", "modern", "classic", "playful"]);
const validLayouts = new Set<FormLayout>(["card", "full-width", "minimal"]);
const validCornerRadii = new Set<FormCornerRadius>(["none", "small", "medium", "large"]);
const validFieldTypes = new Set<FormFieldType>([
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "checkbox",
]);

export type FormBuilderState = {
  status: "idle" | "success" | "error";
  message: string;
};

type FieldPayload = {
  id?: string;
  label: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  options: string[];
};

type DesignPayload = {
  accent_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  font_style: FormFontStyle;
  form_layout: FormLayout;
  corner_radius: FormCornerRadius;
  logo_url: string | null;
  cover_image_url: string | null;
  custom_thank_you_message: string | null;
  submit_button_text: string;
};

export async function createFormAction(
  _state: FormBuilderState,
  formData: FormData,
): Promise<FormBuilderState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const status = String(formData.get("status") || "draft") as FormStatus;
  const fields = parseFields(String(formData.get("fields") || "[]"));
  const design = parseDesign(formData);

  if (title.length < 2 || title.length > 140) {
    return { status: "error", message: "Form title must be between 2 and 140 characters." };
  }

  if (!validStatuses.has(status)) {
    return { status: "error", message: "Choose a valid form status." };
  }

  if (!fields.length) {
    return { status: "error", message: "Add at least one form field." };
  }

  const slug = `${createSlug(title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: createdForm, error } = await supabase
    .from("forms")
    .insert({
      organization_id: organizationContext.activeOrganization.id,
      title,
      description,
      status,
      slug,
      ...design,
      created_by: user.id,
    })
    .select("id, title, slug")
    .single();

  if (error || !createdForm) {
    return { status: "error", message: error?.message ?? "Form could not be created." };
  }

  const { error: fieldsError } = await supabase.from("form_fields").insert(
    fields.map((field, index) => ({
      organization_id: organizationContext.activeOrganization.id,
      form_id: createdForm.id,
      label: field.label,
      field_type: field.fieldType,
      is_required: field.isRequired,
      options: field.options,
      sort_order: index,
    })),
  );

  if (fieldsError) {
    return { status: "error", message: fieldsError.message };
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: "form_created",
    title: "Form created",
    description: `${createdForm.title} was created with ${fields.length} fields.`,
    actorId: user.id,
    metadata: { formId: createdForm.id, slug: createdForm.slug, fieldCount: fields.length },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/list");
  revalidatePath("/dashboard/forms/create");

  return { status: "success", message: `${createdForm.title} was created.` };
}

export async function updateFormAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const formId = String(formData.get("formId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const status = String(formData.get("status") || "draft") as FormStatus;
  const fields = parseFields(String(formData.get("fields") || "[]"));
  const design = parseDesign(formData);

  if (!formId || title.length < 2 || title.length > 140 || !validStatuses.has(status) || !fields.length) {
    redirect(`/dashboard/forms/${formId || ""}/edit?error=invalid`);
  }

  const { data: existingForm } = await supabase
    .from("forms")
    .select("id, title, slug")
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .single();

  if (!existingForm) {
    redirect("/dashboard/forms/list?error=not-found");
  }

  const { error: formError } = await supabase
    .from("forms")
    .update({
      title,
      description,
      status,
      ...design,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formId)
    .eq("organization_id", organizationId);

  if (formError) {
    redirect(`/dashboard/forms/${formId}/edit?error=form`);
  }

  const { data: existingFields } = await supabase
    .from("form_fields")
    .select("id")
    .eq("form_id", formId)
    .eq("organization_id", organizationId);
  const existingIds = new Set((existingFields ?? []).map((field) => field.id));
  const payloadIds = new Set(fields.map((field) => field.id).filter(Boolean));
  const idsToDelete = [...existingIds].filter((id) => !payloadIds.has(id));

  if (idsToDelete.length) {
    const { error: deleteError } = await supabase
      .from("form_fields")
      .delete()
      .eq("organization_id", organizationId)
      .in("id", idsToDelete);

    if (deleteError) {
      redirect(`/dashboard/forms/${formId}/edit?error=fields`);
    }
  }

  for (const [index, field] of fields.entries()) {
    const payload = {
      organization_id: organizationId,
      form_id: formId,
      label: field.label,
      field_type: field.fieldType,
      is_required: field.isRequired,
      options: field.options,
      sort_order: index,
    };

    if (field.id && existingIds.has(field.id)) {
      const { error: updateError } = await supabase
        .from("form_fields")
        .update(payload)
        .eq("id", field.id)
        .eq("organization_id", organizationId);

      if (updateError) {
        redirect(`/dashboard/forms/${formId}/edit?error=fields`);
      }
    } else {
      const { error: insertError } = await supabase.from("form_fields").insert(payload);

      if (insertError) {
        redirect(`/dashboard/forms/${formId}/edit?error=fields`);
      }
    }
  }

  await recordActivityEvent({
    supabase,
    organizationId,
    type: "form_created",
    title: "Form updated",
    description: `${title} settings and fields were updated.`,
    actorId: user.id,
    metadata: { formId, slug: existingForm.slug, fieldCount: fields.length },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/list");
  revalidatePath(`/dashboard/forms/${formId}/edit`);
  revalidatePath(`/forms/${existingForm.slug}`);
  redirect(`/dashboard/forms/${formId}/edit?updated=1`);
}

function parseFields(value: string): FieldPayload[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const fields: FieldPayload[] = [];

  for (const field of parsed) {
    if (!field || typeof field !== "object") {
      continue;
    }

    const source = field as Partial<FieldPayload>;
    const id = typeof source.id === "string" ? source.id.trim() : undefined;
    const label = String(source.label || "").trim();
    const fieldType = source.fieldType;

    if (!label || !fieldType || !validFieldTypes.has(fieldType)) {
      continue;
    }

    fields.push({
      ...(id ? { id } : {}),
      label: label.slice(0, 120),
      fieldType,
      isRequired: Boolean(source.isRequired),
      options: Array.isArray(source.options)
        ? source.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 20)
        : [],
    });
  }

  return fields;
}

function parseDesign(formData: FormData): DesignPayload {
  const accentColor = parseColor(formData.get("accentColor"), "#2563eb");
  const backgroundColor = parseColor(formData.get("backgroundColor"), "#f8fafc");
  const textColor = parseColor(formData.get("textColor"), "#111827");
  const buttonColor = parseColor(formData.get("buttonColor"), "#111827");
  const buttonTextColor = parseColor(formData.get("buttonTextColor"), "#ffffff");
  const fontStyle = String(formData.get("fontStyle") || "default") as FormFontStyle;
  const formLayout = String(formData.get("formLayout") || "card") as FormLayout;
  const cornerRadius = String(formData.get("cornerRadius") || "medium") as FormCornerRadius;

  return {
    accent_color: accentColor,
    background_color: backgroundColor,
    text_color: textColor,
    button_color: buttonColor,
    button_text_color: buttonTextColor,
    font_style: validFontStyles.has(fontStyle) ? fontStyle : "default",
    form_layout: validLayouts.has(formLayout) ? formLayout : "card",
    corner_radius: validCornerRadii.has(cornerRadius) ? cornerRadius : "medium",
    logo_url: parseUrl(formData.get("logoUrl")),
    cover_image_url: parseUrl(formData.get("coverImageUrl")),
    custom_thank_you_message: String(formData.get("customThankYouMessage") || "").trim().slice(0, 240) || null,
    submit_button_text: String(formData.get("submitButtonText") || "").trim().slice(0, 40) || "Submit",
  };
}

function parseColor(value: FormDataEntryValue | null, fallback: string) {
  const color = String(value || "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : fallback;
}

function parseUrl(value: FormDataEntryValue | null) {
  const url = String(value || "").trim();

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function createSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "form"
  );
}
