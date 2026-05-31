"use client";

import { useActionState, useState } from "react";
import { updateOrganizationBrandingAction, type OrganizationBrandingState } from "@/app/dashboard/organizations/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import type { OrganizationSidebarStyle, OrganizationType } from "@/types/database";

const initialState: OrganizationBrandingState = {
  status: "idle",
  message: "",
};

type BrandingValues = {
  name: string;
  displayName: string | null;
  logoUrl: string | null;
  avatarUrl: string | null;
  faviconUrl: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  sidebarStyle: OrganizationSidebarStyle;
  publicBrandingEnabled: boolean;
  customWelcomeMessage: string | null;
  supportEmail: string | null;
  websiteUrl: string | null;
  organizationType: OrganizationType | null;
};

export function OrganizationBrandingForm({
  values,
  disabled,
  activeRole,
}: {
  values: BrandingValues;
  disabled: boolean;
  activeRole: string;
}) {
  const [state, action] = useActionState(updateOrganizationBrandingAction, initialState);
  const [displayName, setDisplayName] = useState(values.displayName ?? "");
  const [logoUrl, setLogoUrl] = useState(values.logoUrl ?? values.avatarUrl ?? "");
  const [accentColor, setAccentColor] = useState(values.accentColor ?? "#111827");
  const [backgroundColor, setBackgroundColor] = useState(values.backgroundColor ?? "#f8fafc");
  const previewName = displayName || values.name;

  return (
    <>
      <Toast
        show={state.status === "success" || state.status === "error"}
        tone={state.status === "error" ? "error" : "success"}
        title={state.status === "error" ? "Branding not saved" : "Branding saved"}
        message={state.message}
      />
      <form action={action} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Section title="Brand identity" description="The name and image people recognize.">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Legal organization name</span>
              <Input name="name" defaultValue={values.name} disabled={disabled} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Display name</span>
              <Input name="displayName" value={displayName} disabled={disabled} placeholder={values.name} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Organization type</span>
              <select name="organizationType" defaultValue={values.organizationType ?? "business"} disabled={disabled} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
                <option value="school">School</option>
                <option value="club">Club</option>
                <option value="business">Business</option>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Logo URL</span>
              <Input name="logoUrl" value={logoUrl} disabled={disabled} type="url" placeholder="https://cdn.example.com/logo.png" onChange={(event) => setLogoUrl(event.target.value)} />
              <span className="text-xs text-muted-foreground">Paste an image URL for now. Uploads are coming later.</span>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Favicon URL</span>
              <Input name="faviconUrl" defaultValue={values.faviconUrl ?? ""} disabled={disabled} type="url" placeholder="https://cdn.example.com/favicon.png" />
              <span className="text-xs text-muted-foreground">Paste an image URL for now. Uploads are coming later.</span>
            </label>
          </Section>

          <Section title="Colors" description="Use a light touch so the workspace stays readable.">
            <ColorField label="Accent color" name="accentColor" value={accentColor} disabled={disabled} onChange={setAccentColor} />
            <ColorField label="Background color" name="backgroundColor" value={backgroundColor} disabled={disabled} onChange={setBackgroundColor} />
            <label className="block space-y-2">
              <span className="text-sm font-medium">Sidebar style</span>
              <select name="sidebarStyle" defaultValue={values.sidebarStyle} disabled={disabled} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </Section>

          <Section title="Public experience" description="Brand public pages such as forms.">
            <label className="flex items-start gap-3 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <input name="publicBrandingEnabled" type="checkbox" defaultChecked={values.publicBrandingEnabled} disabled={disabled} className="mt-1 h-4 w-4 rounded border-zinc-300" />
              <span>
                <span className="block text-sm font-medium">Show organization branding on public pages</span>
                <span className="mt-1 block text-sm text-muted-foreground">Forms can still override colors with form-specific design settings.</span>
              </span>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Custom welcome message</span>
              <textarea name="customWelcomeMessage" defaultValue={values.customWelcomeMessage ?? ""} disabled={disabled} rows={3} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800" />
            </label>
          </Section>

          <Section title="Contact" description="Help people know where to go next.">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Support email</span>
              <Input name="supportEmail" defaultValue={values.supportEmail ?? ""} disabled={disabled} type="email" placeholder="support@example.com" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Website URL</span>
              <Input name="websiteUrl" defaultValue={values.websiteUrl ?? ""} disabled={disabled} type="url" placeholder="https://example.com" />
            </label>
          </Section>

          <input type="hidden" name="avatarUrl" value={values.avatarUrl ?? ""} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ActionSubmitButton pendingLabel="Saving" className="h-11" disabled={disabled}>
              Save branding
            </ActionSubmitButton>
            {disabled ? (
              <p className="text-sm text-muted-foreground">
                Your current role is {activeRole}. Ask an owner or admin to update branding.
              </p>
            ) : null}
          </div>
        </div>

        <Card className="h-fit overflow-hidden">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>A simple feel check for dashboard and public pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border p-4" style={{ backgroundColor }}>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <OrganizationAvatar name={previewName} avatarUrl={logoUrl} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{previewName}</p>
                    <p className="text-xs text-muted-foreground">{values.organizationType ?? "Organization"}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                <button type="button" className="mt-4 h-10 rounded-xl px-4 text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
                  Sample button
                </button>
                <div className="mt-4 rounded-xl border bg-zinc-50 p-3">
                  <p className="text-sm font-medium">Sample card</p>
                  <p className="mt-1 text-xs text-muted-foreground">{values.customWelcomeMessage || "Public form preview feel."}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function ColorField({
  label,
  name,
  value,
  disabled,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        <Input name={name} value={value} disabled={disabled} pattern="^#[0-9A-Fa-f]{6}$" onChange={(event) => onChange(event.target.value)} />
        <input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#111827"} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-11 w-14 rounded-xl border bg-white p-1 shadow-sm disabled:opacity-60 dark:bg-zinc-950" />
      </div>
    </label>
  );
}
