"use client";

import { useActionState } from "react";
import { updateInventorySettingsAction, type OrganizationBrandingState } from "@/app/dashboard/organizations/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";

const initialState: OrganizationBrandingState = {
  status: "idle",
  message: "",
};

export function InventorySettingsForm({
  defaultLoanAgreementText,
  disabled,
}: {
  defaultLoanAgreementText: string;
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateInventorySettingsAction, initialState);

  return (
    <>
      <Toast
        show={state.status === "success" || state.status === "error"}
        tone={state.status === "error" ? "error" : "success"}
        title={state.status === "error" ? "Inventory settings not saved" : "Inventory settings saved"}
        message={state.message}
      />
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>Set the default loan agreement text used when staff loan out inventory items.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Default loan agreement text</span>
              <textarea
                name="defaultLoanAgreementText"
                defaultValue={defaultLoanAgreementText}
                disabled={disabled}
                rows={5}
                required
                className="w-full rounded-xl border bg-white px-3 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950"
              />
            </label>
            <ActionSubmitButton pendingLabel="Saving" disabled={disabled} className="h-11">
              Save inventory settings
            </ActionSubmitButton>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
