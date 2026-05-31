"use client";

import { Archive, Copy, EyeOff, Rocket } from "lucide-react";
import { duplicateFormAction, updateFormStatusAction } from "@/app/dashboard/modules/forms/actions";
import { Button } from "@/components/ui/button";
import type { FormStatus } from "@/types/database";

export function FormLifecycleActions({ formId, status }: { formId: string; status: FormStatus }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={duplicateFormAction}>
        <input type="hidden" name="formId" value={formId} />
        <Button type="submit" variant="secondary" className="h-9 px-3">
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
      </form>
      {status !== "published" ? (
        <StatusForm formId={formId} status="published" label="Publish" icon={Rocket} />
      ) : (
        <StatusForm formId={formId} status="draft" label="Unpublish" icon={EyeOff} />
      )}
      {status !== "archived" ? (
        <form action={updateFormStatusAction}>
          <input type="hidden" name="formId" value={formId} />
          <input type="hidden" name="status" value="archived" />
          <Button
            type="submit"
            variant="outline"
            className="h-9 px-3"
            onClick={(event) => {
              if (!window.confirm("Archive this form? It will remain readable in admin but will not accept public submissions.")) {
                event.preventDefault();
              }
            }}
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function StatusForm({
  formId,
  status,
  label,
  icon: Icon,
}: {
  formId: string;
  status: "draft" | "published";
  label: string;
  icon: typeof Rocket;
}) {
  return (
    <form action={updateFormStatusAction}>
      <input type="hidden" name="formId" value={formId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="secondary" className="h-9 px-3">
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
