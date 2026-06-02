"use client";

import { useActionState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { submitPublicFormAction, type PublicFormState } from "@/app/forms/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRadiusClass, type PublicFormDesign } from "@/lib/forms/design";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Field = Database["public"]["Tables"]["form_fields"]["Row"];
const initialState: PublicFormState = { status: "idle", message: "" };

export function PublicForm({ slug, fields, design }: { slug: string; fields: Field[]; design: PublicFormDesign }) {
  const [state, action, pending] = useActionState(submitPublicFormAction, initialState);
  const radiusClass = getRadiusClass(design.cornerRadius);
  const controlClass = cn(
    "w-full border bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:ring-4",
    radiusClass,
  );

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
        <FieldControl key={field.id} field={field} accentColor={design.accentColor} controlClass={controlClass} radiusClass={radiusClass} />
      ))}

      <Button
        type="submit"
        className={cn("h-12 w-full", radiusClass)}
        style={{ backgroundColor: design.buttonColor, color: design.buttonTextColor }}
        disabled={pending}
      >
        {pending ? "Submitting" : design.submitButtonText || "Submit"}
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

function FieldControl({
  field,
  accentColor,
  controlClass,
  radiusClass,
}: {
  field: Field;
  accentColor: string;
  controlClass: string;
  radiusClass: string;
}) {
  const name = `field_${field.id}`;
  const label = (
    <span className="text-sm font-medium">
      {field.label}
      {field.is_required ? <span style={{ color: accentColor }}> *</span> : null}
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
          className={cn(controlClass, "py-3")}
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
          className={cn(controlClass, "h-11")}
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
    const options = parseOptions(field.options);

    if (options.length) {
      return (
        <fieldset className={cn("space-y-3 border bg-white/70 p-4", radiusClass)}>
          <legend className="text-sm font-medium">
            {field.label}
            {field.is_required ? <span style={{ color: accentColor }}> *</span> : null}
          </legend>
          <div className="grid gap-2">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-3 text-sm">
                <input name={name} value={option} type="checkbox" className="h-4 w-4 rounded border-zinc-300" />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    return (
      <label className={cn("flex items-start gap-3 border bg-white/70 p-4", radiusClass)}>
        <input name={name} value="yes" type="checkbox" required={field.is_required} className="mt-1 h-4 w-4 rounded border-zinc-300" />
        <span>
          {label}
          <span className="mt-1 block text-sm text-zinc-500">Check to confirm.</span>
        </span>
      </label>
    );
  }

  if (field.field_type === "radio") {
    const options = parseOptions(field.options);
    return (
      <fieldset className={cn("space-y-3 border bg-white/70 p-4", radiusClass)}>
        <legend className="text-sm font-medium">
          {field.label}
          {field.is_required ? <span style={{ color: accentColor }}> *</span> : null}
        </legend>
        <div className="grid gap-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 text-sm">
              <input name={name} value={option} type="radio" required={field.is_required} className="h-4 w-4 border-zinc-300" />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.field_type === "yes_no") {
    return (
      <fieldset className={cn("space-y-3 border bg-white/70 p-4", radiusClass)}>
        <legend className="text-sm font-medium">{field.label}{field.is_required ? <span style={{ color: accentColor }}> *</span> : null}</legend>
        <div className="grid grid-cols-2 gap-2">
          {["Yes", "No"].map((option) => (
            <label key={option} className={cn("flex items-center justify-center gap-2 border p-3 text-sm", radiusClass)}>
              <input name={name} value={option} type="radio" required={field.is_required} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.field_type === "scale_1_5" || field.field_type === "scale_1_10") {
    const max = field.field_type === "scale_1_5" ? 5 : 10;
    return (
      <fieldset className={cn("space-y-3 border bg-white/70 p-4", radiusClass)}>
        <legend className="text-sm font-medium">{field.label}{field.is_required ? <span style={{ color: accentColor }}> *</span> : null}</legend>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}>
          {Array.from({ length: max }, (_, index) => String(index + 1)).map((option) => (
            <label key={option} className={cn("flex min-h-10 items-center justify-center border text-sm font-medium", radiusClass)}>
              <input className="sr-only" name={name} value={option} type="radio" required={field.is_required} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
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
      <Input name={name} type={inputType} required={field.is_required} className={cn(radiusClass)} />
    </label>
  );
}

function parseOptions(value: unknown) {
  return Array.isArray(value) ? value.map((option) => String(option)).filter(Boolean) : [];
}
