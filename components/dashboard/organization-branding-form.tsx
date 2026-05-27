"use client";

import { useActionState, useState } from "react";
import { updateOrganizationBrandingAction, type OrganizationBrandingState } from "@/app/dashboard/organizations/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

const initialState: OrganizationBrandingState = {
  status: "idle",
  message: "",
};

export function OrganizationBrandingForm({
  name,
  displayName,
  logoUrl,
  avatarUrl,
  accentColor,
  disabled,
  activeRole,
}: {
  name: string;
  displayName: string | null;
  logoUrl: string | null;
  avatarUrl: string | null;
  accentColor: string;
  disabled: boolean;
  activeRole: string;
}) {
  const [color, setColor] = useState(accentColor);
  const [state, action] = useActionState(updateOrganizationBrandingAction, initialState);

  return (
    <form action={action} className="grid gap-4 p-5 pt-0 md:grid-cols-2">
      <Toast
        show={state.status === "success" || state.status === "error"}
        tone={state.status === "error" ? "error" : "success"}
        title={state.status === "error" ? "Branding not saved" : "Branding saved"}
        message={state.message}
      />
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Legal organization name</span>
        <Input name="name" defaultValue={name} disabled={disabled} required />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Display name</span>
        <Input name="displayName" defaultValue={displayName ?? ""} disabled={disabled} placeholder={name} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Accent color</span>
        <div className="flex gap-2">
          <Input
            name="accentColor"
            value={color}
            disabled={disabled}
            placeholder="#111827"
            pattern="^#[0-9A-Fa-f]{6}$"
            onChange={(event) => setColor(event.target.value)}
          />
          <input
            aria-label="Accent color swatch"
            type="color"
            value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#111827"}
            disabled={disabled}
            onChange={(event) => setColor(event.target.value)}
            className="h-11 w-14 rounded-xl border bg-white p-1 shadow-sm disabled:opacity-60 dark:bg-zinc-950"
          />
        </div>
      </label>
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Organization logo URL</span>
        <Input
          name="logoUrl"
          type="url"
          defaultValue={logoUrl ?? ""}
          disabled={disabled}
          placeholder="https://cdn.example.com/logo.png"
        />
      </label>
      <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
        <ActionSubmitButton pendingLabel="Saving" className="h-11" disabled={disabled}>
          Save branding
        </ActionSubmitButton>
        <p className="text-sm text-muted-foreground">
          Uploaded logo storage can write into this logo URL field later.
        </p>
      </div>
      {disabled ? (
        <p className="md:col-span-2 text-sm text-muted-foreground">
          Your current role is {activeRole}. Ask an owner or admin to update settings.
        </p>
      ) : null}
    </form>
  );
}
