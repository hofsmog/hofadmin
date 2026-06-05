"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";
import type { FormCornerRadius, FormFieldType, FormFontStyle, FormLayout, FormStatus, FormType } from "@/types/database";

const validStatuses = new Set<FormStatus>(["draft", "published", "archived"]);
const validFormTypes = new Set<FormType>(["form", "survey"]);
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
  "radio",
  "scale_1_5",
  "scale_1_10",
  "yes_no",
]);
const formAssetsBucket = "form-public-assets";

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
  enable_email_notifications: boolean;
  notification_emails: string[];
};

export async function createFormAction(
  _state: FormBuilderState,
  formData: FormData,
): Promise<FormBuilderState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const formType = String(formData.get("formType") || "form") as FormType;
  const status = String(formData.get("status") || "draft") as FormStatus;
  const anonymousResponses = formData.get("anonymousResponses") === "on";
  const fields = parseFields(String(formData.get("fields") || "[]"));
  const design = parseDesign(formData);

  if (title.length < 2 || title.length > 140) {
    return { status: "error", message: "Form title must be between 2 and 140 characters." };
  }

  if (!validStatuses.has(status) || !validFormTypes.has(formType)) {
    return { status: "error", message: "Choose a valid form status." };
  }

  if (!fields.length) {
    return { status: "error", message: "Add at least one form field." };
  }

  const logoUpload = await uploadFormLogo({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    assetScope: crypto.randomUUID(),
    file: formData.get("logoFile"),
  });

  if (logoUpload === null) {
    return { status: "error", message: "Logo could not be uploaded. Use a PNG, JPG, SVG, or WebP image under 3 MB." };
  }

  if (logoUpload) {
    design.logo_url = logoUpload;
  }

  const slug = `${createSlug(title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: createdForm, error } = await supabase
    .from("forms")
    .insert({
      organization_id: organizationContext.activeOrganization.id,
      title,
      description,
      form_type: formType,
      status,
      anonymous_responses: formType === "survey" ? anonymousResponses : false,
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
  const formType = String(formData.get("formType") || "form") as FormType;
  const status = String(formData.get("status") || "draft") as FormStatus;
  const anonymousResponses = formData.get("anonymousResponses") === "on";
  const fields = parseFields(String(formData.get("fields") || "[]"));
  const design = parseDesign(formData);

  if (!formId || title.length < 2 || title.length > 140 || !validStatuses.has(status) || !validFormTypes.has(formType) || !fields.length) {
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

  const logoUpload = await uploadFormLogo({
    supabase,
    organizationId,
    assetScope: formId,
    file: formData.get("logoFile"),
  });

  if (logoUpload === null) {
    redirect(`/dashboard/forms/${formId}/edit?error=logo`);
  }

  if (logoUpload) {
    design.logo_url = logoUpload;
  }

  const { error: formError } = await supabase
    .from("forms")
    .update({
      title,
      description,
      form_type: formType,
      status,
      anonymous_responses: formType === "survey" ? anonymousResponses : false,
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

export async function updateFormStatusAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const formId = String(formData.get("formId") || "").trim();
  const status = String(formData.get("status") || "draft") as FormStatus;

  if (!formId || !validStatuses.has(status)) {
    redirect("/dashboard/forms/list?error=invalid");
  }

  const { data: form, error } = await supabase
    .from("forms")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .select("id, title, slug")
    .single();

  if (error || !form) {
    redirect("/dashboard/forms/list?error=status");
  }

  await recordActivityEvent({
    supabase,
    organizationId,
    type: "form_created",
    title: "Form status updated",
    description: `${form.title} is now ${status}.`,
    actorId: user.id,
    metadata: { formId: form.id, slug: form.slug, status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/list");
  revalidatePath(`/forms/${form.slug}`);
  redirect("/dashboard/forms/list?updated=1");
}

export async function duplicateFormAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const formId = String(formData.get("formId") || "").trim();

  if (!formId) {
    redirect("/dashboard/forms/list?error=invalid");
  }

  const [{ data: form }, { data: fields }] = await Promise.all([
    supabase.from("forms").select("*").eq("id", formId).eq("organization_id", organizationId).single(),
    supabase.from("form_fields").select("*").eq("form_id", formId).eq("organization_id", organizationId).order("sort_order", { ascending: true }),
  ]);

  if (!form) {
    redirect("/dashboard/forms/list?error=not-found");
  }

  const title = `Copy of ${form.title}`.slice(0, 140);
  const slug = `${createSlug(title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: copy, error: copyError } = await supabase
    .from("forms")
    .insert({
      organization_id: organizationId,
      title,
      description: form.description,
      form_type: form.form_type,
      status: "draft",
      anonymous_responses: form.anonymous_responses,
      slug,
      accent_color: form.accent_color,
      background_color: form.background_color,
      text_color: form.text_color,
      button_color: form.button_color,
      button_text_color: form.button_text_color,
      font_style: form.font_style,
      form_layout: form.form_layout,
      corner_radius: form.corner_radius,
      logo_url: form.logo_url,
      cover_image_url: form.cover_image_url,
      custom_thank_you_message: form.custom_thank_you_message,
      submit_button_text: form.submit_button_text,
      enable_email_notifications: form.enable_email_notifications,
      notification_emails: form.notification_emails,
      created_by: user.id,
    })
    .select("id, title, slug")
    .single();

  if (copyError || !copy) {
    redirect("/dashboard/forms/list?error=duplicate");
  }

  if (fields?.length) {
    const { error: fieldsError } = await supabase.from("form_fields").insert(
      fields.map((field) => ({
        organization_id: organizationId,
        form_id: copy.id,
        label: field.label,
        field_type: field.field_type,
        is_required: field.is_required,
        options: field.options,
        sort_order: field.sort_order,
      })),
    );

    if (fieldsError) {
      redirect("/dashboard/forms/list?error=duplicate-fields");
    }
  }

  await recordActivityEvent({
    supabase,
    organizationId,
    type: "form_created",
    title: "Form duplicated",
    description: `${form.title} was duplicated as a draft.`,
    actorId: user.id,
    metadata: { sourceFormId: form.id, formId: copy.id, slug: copy.slug },
  });

  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/list");
  redirect(`/dashboard/forms/${copy.id}/edit?duplicated=1`);
}

export async function deleteFormAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const formId = String(formData.get("formId") || "").trim();

  if (!canManageOrganization(organizationContext.activeMembership.role)) {
    redirect("/dashboard/forms/list?error=permission");
  }

  if (!formId) {
    redirect("/dashboard/forms/list?error=invalid");
  }

  const { data: form, error } = await supabase
    .from("forms")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .select("id, title, slug")
    .single();

  if (error || !form) {
    redirect("/dashboard/forms/list?error=delete");
  }

  await recordActivityEvent({
    supabase,
    organizationId,
    type: "form_created",
    title: "Form deleted",
    description: `${form.title} was removed from active forms. Existing responses were kept.`,
    actorId: user.id,
    metadata: { formId: form.id, slug: form.slug, softDelete: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/forms/list");
  revalidatePath("/dashboard/forms/submissions");
  revalidatePath(`/forms/${form.slug}`);
  redirect("/dashboard/forms/list?deleted=1");
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
    enable_email_notifications: formData.get("enableEmailNotifications") === "on",
    notification_emails: parseEmails(String(formData.get("notificationEmails") || "")),
  };
}

function parseEmails(value: string) {
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@"))
    .slice(0, 20);
}

async function uploadFormLogo({
  supabase,
  organizationId,
  assetScope,
  file,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  assetScope: string;
  file: FormDataEntryValue | null;
}) {
  if (!(file instanceof File) || !file.name || file.size === 0) {
    return undefined;
  }

  if (file.size > 3 * 1024 * 1024 || !isAllowedLogoType(file)) {
    return null;
  }

  const safeName = sanitizeFileName(file.name);
  const path = `organizations/${organizationId}/forms/${assetScope}/logo-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(formAssetsBucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return null;
  }

  return supabase.storage.from(formAssetsBucket).getPublicUrl(path).data.publicUrl;
}

function isAllowedLogoType(file: File) {
  return ["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type);
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : "";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "logo";
  return `${base}${extension}`;
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
