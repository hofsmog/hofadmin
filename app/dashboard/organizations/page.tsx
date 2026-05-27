import { Building2, Plus } from "lucide-react";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createOrganizationAction } from "@/app/dashboard/organizations/actions";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function OrganizationsPage() {
  const { organizationContext } = await requireOrganizationContext();

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage tenant workspaces and switch between organizations without leaving the dashboard."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Accessible organizations</CardTitle>
                <CardDescription>Each workspace has independent roles and future module entitlements.</CardDescription>
              </div>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="space-y-3 p-5 pt-0">
            {organizationContext.organizations.map((organization) => (
              <div
                key={organization.id}
                className="flex items-center justify-between gap-4 rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <OrganizationAvatar
                    name={organization.name}
                    avatarUrl={organization.avatarUrl}
                    className="h-10 w-10"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{organization.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{organization.slug}</p>
                  </div>
                </div>
                <Badge className="capitalize">{organization.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <Plus className="h-5 w-5" />
            </div>
            <CardTitle>Create organization</CardTitle>
            <CardDescription>Add a new tenant workspace and become its owner automatically.</CardDescription>
          </CardHeader>
          <form action={createOrganizationAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Name</span>
              <Input name="name" placeholder="Hof North" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Avatar URL</span>
              <Input name="avatarUrl" type="url" placeholder="https://..." />
            </label>
            <ActionSubmitButton pendingLabel="Creating" className="h-11 w-full">
              Create organization
            </ActionSubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
