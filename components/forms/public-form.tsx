"use client";

import { useActionState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { submitPublicFormAction, type PublicFormState } from "@/app/forms/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/database";

type Field = Database["public"]["Tables"]["form_fields"]["Row"];
const initialState: PublicFormState = { status: "idle", message: "" };

export function PublicForm({ slug, fields }: { slug: string; fields: Field[] }) {
  const [state, action, pending] = useActionState(submitPublicFormAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="formSlug" value={slug} />
      {state.status === "error" ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      {fields.map((field) => (
        <FieldControl key={field.id} field={field} />
      ))}

      <Button type="submit" className="h-12 w-full" disabled={pending}>
        {pending ? "Submitting" : "Submit form"}
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

function FieldControl({ field }: { field: Field }) {
  const name = `field_${field.id}`;
  const label = (
    <span className="text-sm font-medium">
      {field.label}
      {field.is_required ? <span className="text-red-600"> *</span> : null}
    </span>
  );

  if (field.field_type === "textarea") {
    return (
      <label className="block space-y-2">
        {label}
        <textarea
          name={name}
          required={field.is_required}
          rows={4}
          className="w-full rounded-xl border bg-white px-3 py-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70"
        />
      </label>
    );
  }

  if (field.field_type === "select") {
    const options = parseOptions(field.options);
    return (
      <label className="block space-y-2">
        {label}
        <select
          name={name}
          required={field.is_required}
          className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70"
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <label className="flex items-start gap-3 rounded-xl border bg-zinc-50 p-4">
        <input name={name} value="yes" type="checkbox" required={field.is_required} className="mt-1 h-4 w-4 rounded border-zinc-300" />
        <span>
          {label}
          <span className="mt-1 block text-sm text-zinc-500">Check to confirm.</span>
        </span>
      </label>
    );
  }

  const inputType =
    field.field_type === "phone"
      ? "tel"
      : field.field_type === "number"
        ? "number"
        : field.field_type === "date"
          ? "date"
          : field.field_type;

  return (
    <label className="block space-y-2">
      {label}
      <Input name={name} type={inputType} required={field.is_required} />
    </label>
  );
}

function parseOptions(value: unknown) {
  return Array.isArray(value) ? value.map((option) => String(option)).filter(Boolean) : [];
}
