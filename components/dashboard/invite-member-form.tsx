import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inviteMemberAction } from "@/app/dashboard/organizations/actions";
import type { OrganizationRole } from "@/types/database";

export function InviteMemberForm({
  disabled,
  activeRole,
}: {
  disabled: boolean;
  activeRole: OrganizationRole;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>
          Invite admins or members into the active organization. Owner transfer can be added later.
        </CardDescription>
      </CardHeader>
      <form action={inviteMemberAction} className="grid gap-4 p-5 pt-0 md:grid-cols-[1fr_11rem_auto]">
        <Input name="email" type="email" placeholder="member@company.com" disabled={disabled} required />
        <select
          name="role"
          disabled={disabled}
          defaultValue="member"
          className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <ActionSubmitButton className="h-11" pendingLabel="Inviting" disabled={disabled}>
          Invite
        </ActionSubmitButton>
      </form>
      {disabled ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">
          Your current role is {activeRole}. Only owners and admins can invite team members.
        </p>
      ) : null}
    </Card>
  );
}
