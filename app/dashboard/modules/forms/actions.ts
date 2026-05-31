"use server";

import { revalidatePath } from "next/cache";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { FormFieldType, FormStatus } from "@/types/database";

const validStatuses = new Set<FormStatus>(["draft", "active", "archived"]);
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
  label: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  options: string[];
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

  return parsed
    .map((field) => {
      if (!field || typeof field !== "object") {
        return null;
      }

      const source = field as Partial<FieldPayload>;
      const label = String(source.label || "").trim();
      const fieldType = source.fieldType;

      if (!label || !fieldType || !validFieldTypes.has(fieldType)) {
        return null;
      }

      return {
        label: label.slice(0, 120),
        fieldType,
        isRequired: Boolean(source.isRequired),
        options: Array.isArray(source.options)
          ? source.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 20)
          : [],
      };
    })
    .filter((field): field is FieldPayload => Boolean(field));
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
