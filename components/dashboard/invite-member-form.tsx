"use client";

import { useActionState } from "react";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inviteMemberAction, type InviteMemberState } from "@/app/dashboard/organizations/actions";
import type { OrganizationRole } from "@/types/database";

const initialState: InviteMemberState = { status: "idle", message: "" };

export function InviteMemberForm({
  disabled,
  activeRole,
  groups = [],
}: {
  disabled: boolean;
  activeRole: OrganizationRole;
  groups?: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState(inviteMemberAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite teammate</CardTitle>
        <CardDescription>
          Send an email invitation and choose the teammate&apos;s role.
        </CardDescription>
      </CardHeader>
      <form action={action} className="grid gap-4 p-5 pt-0">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_11rem]">
        <Input name="email" type="email" placeholder="member@company.com" disabled={disabled} required />
        <Input name="name" placeholder="Name (optional)" disabled={disabled} />
        <select
          name="role"
          disabled={disabled}
          defaultValue="member"
          className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
        >
          {activeRole === "owner" ? <option value="owner">Owner</option> : null}
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </select>
        </div>
        {groups.length ? (
          <div className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
            <p className="text-sm font-medium">Add to groups</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {groups.map((group) => (
                <label key={group.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                  <input type="checkbox" name="groupIds" value={group.id} disabled={disabled} className="h-4 w-4 rounded border-zinc-300" />
                  <span>{group.name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <ActionSubmitButton className="h-11" pendingLabel="Inviting" disabled={disabled}>
          Send invitation
        </ActionSubmitButton>
      </form>
      {state.status !== "idle" && state.message ? (
        <div
          className={
            state.status === "success"
              ? "mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300"
              : state.status === "warning"
                ? "mx-5 mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-200"
                : "mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300"
          }
        >
          {state.message}
        </div>
      ) : null}
      {disabled ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">
          Your current role is {activeRole}. Only owners and admins can invite team members.
        </p>
      ) : null}
    </Card>
  );
}
