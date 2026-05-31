"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { createFormAction, type FormBuilderState } from "@/app/dashboard/modules/forms/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { FormFieldType } from "@/types/database";

const initialState: FormBuilderState = { status: "idle", message: "" };

const fieldTypes: Array<{ label: string; value: FormFieldType }> = [
  { label: "Text", value: "text" },
  { label: "Textarea", value: "textarea" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
  { label: "Number", value: "number" },
  { label: "Date", value: "date" },
  { label: "Select", value: "select" },
  { label: "Checkbox", value: "checkbox" },
];

type BuilderField = {
  id: string;
  label: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  options: string;
};

export function FormCreateForm() {
  const [state, action] = useActionState(createFormAction, initialState);
  const [fields, setFields] = useState<BuilderField[]>([
    { id: crypto.randomUUID(), label: "Full name", fieldType: "text", isRequired: true, options: "" },
  ]);

  const fieldsPayload = useMemo(
    () =>
      JSON.stringify(
        fields
          .filter((field) => field.label.trim())
          .map((field) => ({
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

  function updateField(id: string, updates: Partial<BuilderField>) {
    setFields((currentFields) =>
      currentFields.map((field) => (field.id === id ? { ...field, ...updates } : field)),
    );
  }

  function addField() {
    setFields((currentFields) => [
      ...currentFields,
      { id: crypto.randomUUID(), label: "", fieldType: "text", isRequired: false, options: "" },
    ]);
  }

  function removeField(id: string) {
    setFields((currentFields) => currentFields.filter((field) => field.id !== id));
  }

  return (
    <Card id="create-form" className="overflow-hidden">
      <Toast
        show={state.status === "success" || state.status === "error"}
        tone={state.status === "error" ? "error" : "success"}
        title={state.status === "error" ? "Form not created" : "Form created"}
        message={state.message}
      />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Create form</CardTitle>
            <CardDescription>Build a structured organization form with reusable field definitions.</CardDescription>
          </div>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <form action={action} className="space-y-5 p-5 pt-0">
        <input type="hidden" name="fields" value={fieldsPayload} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Title</span>
            <Input name="title" placeholder="Volunteer signup" required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select name="status" defaultValue="draft" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Description</span>
            <Input name="description" placeholder="Collect event volunteer details" />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Fields</p>
              <p className="text-xs text-muted-foreground">Select and checkbox fields can use comma-separated options.</p>
            </div>
            <Button type="button" variant="secondary" className="h-9 px-3" onClick={addField}>
              <Plus className="h-4 w-4" />
              Add field
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto]">
                <Input
                  value={field.label}
                  onChange={(event) => updateField(field.id, { label: event.target.value })}
                  placeholder={`Field ${index + 1} label`}
                />
                <select
                  value={field.fieldType}
                  onChange={(event) => updateField(field.id, { fieldType: event.target.value as FormFieldType })}
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
                  onClick={() => removeField(field.id)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => updateField(field.id, { isRequired: !field.isRequired })}
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
                {(field.fieldType === "select" || field.fieldType === "checkbox") ? (
                  <Input
                    value={field.options}
                    onChange={(event) => updateField(field.id, { options: event.target.value })}
                    placeholder="Options: Morning, Afternoon, Evening"
                  />
                ) : (
                  <Badge>{field.fieldType}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <ActionSubmitButton pendingLabel="Creating form" className="h-11">
          Create form
        </ActionSubmitButton>
      </form>
    </Card>
  );
}
