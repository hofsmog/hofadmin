import { Settings } from "lucide-react";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateOrganizationAction } from "@/app/dashboard/organizations/actions";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";

export default async function SettingsPage() {
  const { organizationContext } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;
  const canEdit = canManageOrganization(activeMembership.role);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure organization profile, security defaults, module policy, localization, and workspace preferences."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <OrganizationAvatar
                name={activeOrganization.name}
                avatarUrl={activeOrganization.avatarUrl}
                className="h-14 w-14"
              />
              <div>
                <CardTitle>Organization profile</CardTitle>
                <CardDescription>
                  Update the active organization name and avatar URL. Storage upload can be connected later.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <form action={updateOrganizationAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Name</span>
              <Input name="name" defaultValue={activeOrganization.name} disabled={!canEdit} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Avatar URL</span>
              <Input
                name="avatarUrl"
                type="url"
                defaultValue={activeOrganization.avatarUrl ?? ""}
                disabled={!canEdit}
                placeholder="https://..."
              />
            </label>
            <ActionSubmitButton pendingLabel="Saving" className="h-11">
              Save changes
            </ActionSubmitButton>
            {!canEdit ? (
              <p className="text-sm text-muted-foreground">
                Your current role is {activeMembership.role}. Ask an owner or admin to update settings.
              </p>
            ) : null}
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <Settings className="h-5 w-5" />
            </div>
            <CardTitle>Governance ready</CardTitle>
            <CardDescription>
              This organization scope is ready for RLS-backed module entitlements, audit events, and role policies.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
