"use client";

import { useState } from "react";
import { Copy, EyeOff, MoreHorizontal, Rocket, Trash2, X } from "lucide-react";
import { deleteFormAction, duplicateFormAction, updateFormStatusAction } from "@/app/dashboard/modules/forms/actions";
import { Button } from "@/components/ui/button";
import type { FormStatus } from "@/types/database";

export function FormLifecycleActions({ formId, status, compact = false }: { formId: string; status: FormStatus; compact?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex flex-wrap gap-2">
      {!compact ? (status !== "published" ? <StatusForm formId={formId} status="published" label="Publish" icon={Rocket} /> : <StatusForm formId={formId} status="draft" label="Unpublish" icon={EyeOff} />) : null}
      <Button type="button" variant="secondary" className="h-9 px-3" onClick={() => setMenuOpen((open) => !open)}>
        <MoreHorizontal className="h-4 w-4" />
        <span className={compact ? "sr-only" : ""}>More</span>
      </Button>
      {menuOpen ? (
        <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border bg-white p-2 shadow-lg dark:bg-zinc-950">
          {compact ? (status !== "published" ? <StatusForm formId={formId} status="published" label="Publish" icon={Rocket} menuItem /> : <StatusForm formId={formId} status="draft" label="Unpublish" icon={EyeOff} menuItem />) : null}
          <form action={duplicateFormAction}>
            <input type="hidden" name="formId" value={formId} />
            <Button type="submit" variant="ghost" className="h-9 w-full justify-start px-3">
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
          </form>
          {status !== "archived" ? <DeleteFormButton formId={formId} menuItem /> : null}
        </div>
      ) : null}
    </div>
  );
}

function DeleteFormButton({ formId, menuItem = false }: { formId: string; menuItem?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={menuItem ? "ghost" : "outline"} className={menuItem ? "h-9 w-full justify-start px-3 text-red-600 dark:text-red-300" : "h-9 px-3"} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Delete form?</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This removes the form from active lists and disables the public link. Existing submissions stay available in Responses.
                </p>
              </div>
              <button type="button" className="rounded-lg p-1 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <form action={deleteFormAction}>
                <input type="hidden" name="formId" value={formId} />
                <Button type="submit" className="w-full sm:w-auto">
                  Delete form
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatusForm({
  formId,
  status,
  label,
  icon: Icon,
  menuItem = false,
}: {
  formId: string;
  status: "draft" | "published";
  label: string;
  icon: typeof Rocket;
  menuItem?: boolean;
}) {
  return (
    <form action={updateFormStatusAction}>
      <input type="hidden" name="formId" value={formId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={menuItem ? "ghost" : "secondary"} className={menuItem ? "h-9 w-full justify-start px-3" : "h-9 px-3"}>
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
