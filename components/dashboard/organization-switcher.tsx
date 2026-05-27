"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createOrganizationAction, switchOrganizationAction } from "@/app/dashboard/organizations/actions";
import type { OrganizationContext } from "@/types";

export function OrganizationSwitcher({ context }: { context: OrganizationContext }) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-5 flex w-full items-center justify-between rounded-xl border bg-zinc-50 px-3 py-2.5 text-left shadow-sm transition hover:bg-white dark:bg-zinc-900 dark:hover:bg-zinc-900/70"
      >
        <span className="flex min-w-0 items-center gap-3">
          <OrganizationAvatar
            name={context.activeOrganization.name}
            avatarUrl={context.activeOrganization.avatarUrl}
            className="h-9 w-9"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{context.activeOrganization.name}</span>
            <span className="block text-xs capitalize text-muted-foreground">{context.activeMembership.role}</span>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-zinc-500" />
      </button>

      {open ? (
        <Card className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden p-2 shadow-xl shadow-zinc-950/10">
          <div className="space-y-1">
            {context.organizations.map((organization) => (
              <form key={organization.id} action={switchOrganizationAction}>
                <input type="hidden" name="organizationId" value={organization.id} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  onClick={() => setOpen(false)}
                >
                  <OrganizationAvatar
                    name={organization.name}
                    avatarUrl={organization.avatarUrl}
                    className="h-8 w-8"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{organization.name}</span>
                    <span className="block text-xs capitalize text-muted-foreground">{organization.role}</span>
                  </span>
                </button>
              </form>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Plus className="h-4 w-4" />
            Create organization
          </button>
        </Card>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Create organization</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Add another tenant workspace for teams, clubs, schools, venues, or businesses.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={createOrganizationAction} className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Organization name</span>
                <Input name="name" placeholder="Hof North" required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Avatar URL</span>
                <Input name="avatarUrl" type="url" placeholder="https://..." />
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <ActionSubmitButton pendingLabel="Creating">Create</ActionSubmitButton>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
