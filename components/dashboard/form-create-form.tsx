"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, GripVertical, Palette, Plus, Settings, SlidersHorizontal, Trash2 } from "lucide-react";
import { createFormAction, updateFormAction, type FormBuilderState } from "@/app/dashboard/modules/forms/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Database, FormCornerRadius, FormFieldType, FormFontStyle, FormLayout, FormStatus, FormType } from "@/types/database";

const initialState: FormBuilderState = { status: "idle", message: "" };

const fieldTypes: Array<{ label: string; value: FormFieldType }> = [
  { label: "Short text", value: "text" },
  { label: "Long text", value: "textarea" },
  { label: "Email", value: "email" },
  { label: "Phone number", value: "phone" },
  { label: "Number", value: "number" },
  { label: "Date", value: "date" },
  { label: "Dropdown", value: "select" },
  { label: "Checkboxes", value: "checkbox" },
  { label: "Multiple choice", value: "radio" },
  { label: "Scale 1-5", value: "scale_1_5" },
  { label: "Scale 1-10", value: "scale_1_10" },
  { label: "Yes/No", value: "yes_no" },
];

const tabs = [
  { id: "fields", label: "Fields", icon: SlidersHorizontal },
  { id: "design", label: "Design", icon: Palette },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "preview", label: "Preview", icon: Eye },
] as const;

type TabId = (typeof tabs)[number]["id"];
type FormRow = Database["public"]["Tables"]["forms"]["Row"];
type FieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

type BuilderField = {
  id?: string;
  clientId: string;
  label: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  options: string;
};

type DesignState = {
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontStyle: FormFontStyle;
  formLayout: FormLayout;
  cornerRadius: FormCornerRadius;
  logoUrl: string;
  coverImageUrl: string;
  customThankYouMessage: string;
  submitButtonText: string;
};

export function FormCreateForm({ formType = "form" }: { formType?: FormType }) {
  const [state, action] = useActionState(createFormAction, initialState);

  return (
    <FormBuilder
      mode="create"
      initialFormType={formType}
      state={state}
      action={action}
      toastTitle={state.status === "error" ? "Form not created" : "Form created"}
    />
  );
}

export function FormEditForm({
  form,
  fields,
  updated,
  error,
}: {
  form: FormRow;
  fields: FieldRow[];
  updated?: boolean;
  error?: boolean;
}) {
  return (
    <FormBuilder
      mode="edit"
      form={form}
      fields={fields}
      action={updateFormAction}
      updated={updated}
      error={error}
      toastTitle="Form updated"
    />
  );
}

function FormBuilder({
  mode,
  initialFormType = "form",
  form,
  fields: initialFields,
  state,
  action,
  updated,
  error,
  toastTitle,
}: {
  mode: "create" | "edit";
  initialFormType?: FormType;
  form?: FormRow;
  fields?: FieldRow[];
  state?: FormBuilderState;
  action: (payload: FormData) => void | Promise<void> | ((payload: FormData) => void);
  updated?: boolean;
  error?: boolean;
  toastTitle: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("fields");
  const [title, setTitle] = useState(form?.title ?? "Volunteer signup");
  const [description, setDescription] = useState(form?.description ?? "Collect information with a clean public form.");
  const [formType, setFormType] = useState<FormType>(form?.form_type ?? initialFormType);
  const [status, setStatus] = useState<FormStatus>(form?.status === "active" ? "published" : form?.status ?? "draft");
  const [anonymousResponses, setAnonymousResponses] = useState(form?.anonymous_responses ?? initialFormType === "survey");
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(form?.enable_email_notifications ?? false);
  const [notificationEmails, setNotificationEmails] = useState((form?.notification_emails ?? []).join(", "));
  const [design, setDesign] = useState<DesignState>({
    accentColor: form?.accent_color ?? "#2563eb",
    backgroundColor: form?.background_color ?? "#f8fafc",
    textColor: form?.text_color ?? "#111827",
    buttonColor: form?.button_color ?? "#111827",
    buttonTextColor: form?.button_text_color ?? "#ffffff",
    fontStyle: form?.font_style ?? "default",
    formLayout: form?.form_layout ?? "card",
    cornerRadius: form?.corner_radius ?? "medium",
    logoUrl: form?.logo_url ?? "",
    coverImageUrl: form?.cover_image_url ?? "",
    customThankYouMessage: form?.custom_thank_you_message ?? "",
    submitButtonText: form?.submit_button_text ?? "Submit",
  });
  const [fields, setFields] = useState<BuilderField[]>(
    initialFields?.length
      ? initialFields
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((field) => ({
            id: field.id,
            clientId: field.id,
            label: field.label,
            fieldType: field.field_type,
            isRequired: field.is_required,
            options: parseOptions(field.options).join(", "),
          }))
      : [{ clientId: crypto.randomUUID(), label: "Full name", fieldType: "text", isRequired: true, options: "" }],
  );

  const fieldsPayload = useMemo(
    () =>
      JSON.stringify(
        fields
          .filter((field) => field.label.trim())
          .map((field) => ({
            id: field.id,
            label: field.label.trim(),
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            options: field.options
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean),
          })),
      ),
    [fields],
  );

  function updateField(clientId: string, updates: Partial<BuilderField>) {
    setFields((currentFields) =>
      currentFields.map((field) => (field.clientId === clientId ? { ...field, ...updates } : field)),
    );
  }

  function updateDesign(updates: Partial<DesignState>) {
    setDesign((currentDesign) => ({ ...currentDesign, ...updates }));
  }

  function addField() {
    setFields((currentFields) => [
      ...currentFields,
      { clientId: crypto.randomUUID(), label: "", fieldType: "text", isRequired: false, options: "" },
    ]);
  }

  function removeField(clientId: string) {
    setFields((currentFields) => currentFields.filter((field) => field.clientId !== clientId));
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((currentFields) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= currentFields.length) {
        return currentFields;
      }

      const nextFields = [...currentFields];
      [nextFields[index], nextFields[targetIndex]] = [nextFields[targetIndex], nextFields[index]];
      return nextFields;
    });
  }

  return (
    <Card id={mode === "create" ? "create-form" : "edit-form"} className="overflow-hidden">
      <Toast
        show={Boolean(state?.status === "success" || state?.status === "error" || updated || error)}
        tone={state?.status === "error" || error ? "error" : "success"}
        title={state?.status === "error" || error ? "Form not saved" : toastTitle}
        message={state?.message || (updated ? "Your form customization was saved." : error ? "Please review the form and try again." : "")}
      />
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{mode === "create" ? "Create form" : "Edit form"}</CardTitle>
            <CardDescription>Customize questions, visual design, publishing status, and the live public experience.</CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
                    activeTab === tab.id
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <form action={action as never} className="grid gap-5 p-5 pt-0 xl:grid-cols-[1fr_24rem]">
        <input type="hidden" name="fields" value={fieldsPayload} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="formType" value={formType} />
        <input type="hidden" name="status" value={status} />
        {anonymousResponses ? <input type="hidden" name="anonymousResponses" value="on" /> : null}
        <input type="hidden" name="notificationEmails" value={notificationEmails} />
        {enableEmailNotifications ? <input type="hidden" name="enableEmailNotifications" value="on" /> : null}
        {form ? <input type="hidden" name="formId" value={form.id} /> : null}
        <HiddenDesignInputs design={design} />

        <div className="min-w-0 space-y-5">
          {activeTab === "fields" ? (
            <FieldsPanel
              fields={fields}
              addField={addField}
              updateField={updateField}
              removeField={removeField}
              moveField={moveField}
            />
          ) : null}

          {activeTab === "design" ? <DesignPanel design={design} updateDesign={updateDesign} /> : null}

          {activeTab === "settings" ? (
            <SettingsPanel
              title={title}
              description={description}
              status={status}
              formType={formType}
              anonymousResponses={anonymousResponses}
              setTitle={setTitle}
              setDescription={setDescription}
              setFormType={setFormType}
              setStatus={setStatus}
              setAnonymousResponses={setAnonymousResponses}
              enableEmailNotifications={enableEmailNotifications}
              notificationEmails={notificationEmails}
              setEnableEmailNotifications={setEnableEmailNotifications}
              setNotificationEmails={setNotificationEmails}
            />
          ) : null}

          {activeTab === "preview" ? (
            <PreviewPanel title={title} description={description} fields={fields} design={design} />
          ) : null}

          <ActionSubmitButton pendingLabel={mode === "create" ? "Creating form" : "Saving form"} className="h-11">
            {mode === "create" ? "Create form" : "Save changes"}
          </ActionSubmitButton>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-24">
            <PreviewPanel title={title} description={description} fields={fields} design={design} compact />
          </div>
        </div>
      </form>
    </Card>
  );
}

function HiddenDesignInputs({ design }: { design: DesignState }) {
  return (
    <>
      {Object.entries(design).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </>
  );
}

function SettingsPanel({
  title,
  description,
  status,
  formType,
  anonymousResponses,
  setTitle,
  setDescription,
  setFormType,
  setStatus,
  setAnonymousResponses,
  enableEmailNotifications,
  notificationEmails,
  setEnableEmailNotifications,
  setNotificationEmails,
}: {
  title: string;
  description: string;
  status: FormStatus;
  formType: FormType;
  anonymousResponses: boolean;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setFormType: (value: FormType) => void;
  setStatus: (value: FormStatus) => void;
  setAnonymousResponses: (value: boolean) => void;
  enableEmailNotifications: boolean;
  notificationEmails: string;
  setEnableEmailNotifications: (value: boolean) => void;
  setNotificationEmails: (value: string) => void;
}) {
  return (
    <section className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Title</span>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Volunteer signup" required />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Type</span>
          <select value={formType} onChange={(event) => setFormType(event.target.value as FormType)} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            <option value="form">Form</option>
            <option value="survey">Survey</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as FormStatus)} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        {formType === "survey" ? (
          <label className="flex items-start gap-3 rounded-xl border bg-white p-4 dark:bg-zinc-950 md:col-span-2">
            <input type="checkbox" checked={anonymousResponses} onChange={(event) => setAnonymousResponses(event.target.checked)} className="mt-1 h-4 w-4 rounded border-zinc-300" />
            <span>
              <span className="block text-sm font-medium">Anonymous responses</span>
              <span className="mt-1 block text-sm text-muted-foreground">Respondents will clearly see that the survey is anonymous. Email is not saved as the response contact.</span>
            </span>
          </label>
        ) : null}
        <label className="block space-y-2">
          <span className="text-sm font-medium">Description</span>
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Collect event volunteer details" />
        </label>
        <label className="flex items-start gap-3 rounded-xl border bg-white p-4 dark:bg-zinc-950 md:col-span-2">
          <input type="checkbox" checked={enableEmailNotifications} onChange={(event) => setEnableEmailNotifications(event.target.checked)} className="mt-1 h-4 w-4 rounded border-zinc-300" />
          <span>
            <span className="block text-sm font-medium">Email notifications</span>
            <span className="mt-1 block text-sm text-muted-foreground">Send an email when this form receives a new submission.</span>
          </span>
        </label>
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Notification emails</span>
          <Input value={notificationEmails} onChange={(event) => setNotificationEmails(event.target.value)} placeholder="owner@example.com, admin@example.com" />
        </label>
      </div>
    </section>
  );
}

function FieldsPanel({
  fields,
  addField,
  updateField,
  removeField,
  moveField,
}: {
  fields: BuilderField[];
  addField: () => void;
  updateField: (clientId: string, updates: Partial<BuilderField>) => void;
  removeField: (clientId: string) => void;
  moveField: (index: number, direction: -1 | 1) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function moveDraggedField(targetClientId: string) {
    if (!draggingId || draggingId === targetClientId) {
      return;
    }

    const fromIndex = fields.findIndex((field) => field.clientId === draggingId);
    const toIndex = fields.findIndex((field) => field.clientId === targetClientId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    moveField(fromIndex, toIndex > fromIndex ? 1 : -1);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Questions</p>
          <p className="text-xs text-muted-foreground">Move questions up or down to control public form order.</p>
        </div>
        <Button type="button" variant="secondary" className="h-9 px-3" onClick={addField}>
          <Plus className="h-4 w-4" />
          Add field
        </Button>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.clientId}
          draggable
          onDragStart={() => setDraggingId(field.clientId)}
          onDragOver={(event) => {
            event.preventDefault();
            moveDraggedField(field.clientId);
          }}
          onDragEnd={() => setDraggingId(null)}
          className={cn("rounded-xl border bg-zinc-50 p-4 transition dark:bg-zinc-900/60", draggingId === field.clientId && "opacity-60")}
        >
          <div className="grid gap-3 md:grid-cols-[auto_auto_1fr_10rem_auto]">
            <div className="flex h-11 items-center justify-center text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" className="h-11 w-10 px-0" onClick={() => moveField(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" className="h-11 w-10 px-0" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={field.label}
              onChange={(event) => updateField(field.clientId, { label: event.target.value })}
              placeholder={`Field ${index + 1} label`}
            />
            <select
              value={field.fieldType}
              onChange={(event) => updateField(field.clientId, { fieldType: event.target.value as FormFieldType })}
              className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            >
              {fieldTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-3"
              onClick={() => removeField(field.clientId)}
              disabled={fields.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => updateField(field.clientId, { isRequired: !field.isRequired })}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
                field.isRequired
                  ? "border-zinc-950 bg-white text-zinc-950 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50"
                  : "bg-white text-muted-foreground dark:bg-zinc-950",
              )}
            >
              <Check className={cn("h-4 w-4", field.isRequired ? "opacity-100" : "opacity-30")} />
              Required
            </button>
            {field.fieldType === "select" || field.fieldType === "checkbox" || field.fieldType === "radio" ? (
              <Input
                value={field.options}
                onChange={(event) => updateField(field.clientId, { options: event.target.value })}
                placeholder="Options: Yes, No, Maybe"
              />
            ) : (
              <Badge>{field.fieldType}</Badge>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

function DesignPanel({
  design,
  updateDesign,
}: {
  design: DesignState;
  updateDesign: (updates: Partial<DesignState>) => void;
}) {
  return (
    <section className="grid gap-4 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60 md:grid-cols-2">
      <ColorField label="Accent color" value={design.accentColor} onChange={(accentColor) => updateDesign({ accentColor })} />
      <ColorField label="Background color" value={design.backgroundColor} onChange={(backgroundColor) => updateDesign({ backgroundColor })} />
      <ColorField label="Text color" value={design.textColor} onChange={(textColor) => updateDesign({ textColor })} />
      <ColorField label="Button color" value={design.buttonColor} onChange={(buttonColor) => updateDesign({ buttonColor })} />
      <ColorField label="Button text color" value={design.buttonTextColor} onChange={(buttonTextColor) => updateDesign({ buttonTextColor })} />
      <label className="block space-y-2">
        <span className="text-sm font-medium">Font style</span>
        <select value={design.fontStyle} onChange={(event) => updateDesign({ fontStyle: event.target.value as FormFontStyle })} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
          <option value="default">Default</option>
          <option value="modern">Modern</option>
          <option value="classic">Classic</option>
          <option value="playful">Playful</option>
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Form layout</span>
        <select value={design.formLayout} onChange={(event) => updateDesign({ formLayout: event.target.value as FormLayout })} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
          <option value="card">Card</option>
          <option value="full-width">Full-width</option>
          <option value="minimal">Minimal</option>
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Corner radius</span>
        <select value={design.cornerRadius} onChange={(event) => updateDesign({ cornerRadius: event.target.value as FormCornerRadius })} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Logo URL</span>
        <Input value={design.logoUrl} onChange={(event) => updateDesign({ logoUrl: event.target.value })} placeholder="https://example.com/logo.png" />
      </label>
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Cover image URL</span>
        <Input value={design.coverImageUrl} onChange={(event) => updateDesign({ coverImageUrl: event.target.value })} placeholder="https://example.com/cover.jpg" />
      </label>
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Custom thank-you message</span>
        <Input value={design.customThankYouMessage} onChange={(event) => updateDesign({ customThankYouMessage: event.target.value })} placeholder="Thank you. Your response has been submitted." />
      </label>
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Submit button text</span>
        <Input value={design.submitButtonText} maxLength={40} onChange={(event) => updateDesign({ submitButtonText: event.target.value })} placeholder="Submit" />
      </label>
    </section>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-12 rounded-xl border bg-white p-1" />
        <Input value={value} onChange={(event) => onChange(event.target.value)} pattern="^#[0-9A-Fa-f]{6}$" />
      </div>
    </label>
  );
}

function PreviewPanel({
  title,
  description,
  fields,
  design,
  compact = false,
}: {
  title: string;
  description: string;
  fields: BuilderField[];
  design: DesignState;
  compact?: boolean;
}) {
  const radius = radiusClass(design.cornerRadius);

  return (
    <section
      className={cn("overflow-hidden border shadow-sm", radius, design.formLayout === "minimal" && "border-transparent shadow-none")}
      style={{ backgroundColor: design.backgroundColor, color: design.textColor }}
    >
      {design.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={design.coverImageUrl} alt="" className="h-32 w-full object-cover" />
      ) : null}
      <div className={cn("space-y-4 p-5", design.formLayout === "full-width" && "sm:p-8")}>
        {design.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={design.logoUrl} alt="" className="h-12 max-w-40 object-contain" />
        ) : null}
        <div style={{ borderLeft: `4px solid ${design.accentColor}` }} className="pl-4">
          <h3 className={cn("font-semibold", compact ? "text-lg" : "text-2xl", fontClass(design.fontStyle))}>{title || "Untitled form"}</h3>
          {description ? <p className="mt-2 text-sm opacity-75">{description}</p> : null}
        </div>
        <div className="space-y-3">
          {fields.slice(0, compact ? 4 : fields.length).map((field) => (
            <div key={field.clientId} className="space-y-1.5">
              <p className="text-sm font-medium">
                {field.label || "Untitled question"}
                {field.isRequired ? <span style={{ color: design.accentColor }}> *</span> : null}
              </p>
              <div className={cn("h-10 border bg-white/70", radius)} />
            </div>
          ))}
        </div>
        <button type="button" className={cn("h-11 w-full px-4 text-sm font-medium", radius)} style={{ backgroundColor: design.buttonColor, color: design.buttonTextColor }}>
          {design.submitButtonText || "Submit"}
        </button>
      </div>
    </section>
  );
}

function parseOptions(value: unknown) {
  return Array.isArray(value) ? value.map((option) => String(option)).filter(Boolean) : [];
}

function radiusClass(radius: FormCornerRadius) {
  return {
    none: "rounded-none",
    small: "rounded-md",
    medium: "rounded-xl",
    large: "rounded-3xl",
  }[radius];
}

function fontClass(fontStyle: FormFontStyle) {
  return {
    default: "",
    modern: "font-sans tracking-tight",
    classic: "font-serif",
    playful: "font-sans",
  }[fontStyle];
}
