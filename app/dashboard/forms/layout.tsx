import { toggleModuleAction } from "@/app/dashboard/modules/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { isModuleEnabled } from "@/lib/modules";
import { canManageOrganization } from "@/lib/organizations";

export default async function FormsLayout({ children }: { children: React.ReactNode }) {
  const { organizationContext } = await requireOrganizationContext();
  const formsEnabled = isModuleEnabled("forms", organizationContext.activeOrganization);
  const canManage = canManageOrganization(organizationContext.activeMembership.role);

  if (!formsEnabled) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Forms is not enabled for this organization.</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Enable Forms to create forms, publish links, collect responses, and manage submissions.
          </p>
          {canManage ? (
            <form action={toggleModuleAction} className="mt-5">
              <input type="hidden" name="moduleId" value="forms" />
              <input type="hidden" name="enabled" value="true" />
              <input type="hidden" name="returnTo" value="/dashboard/forms" />
              <Button type="submit">Enable Forms</Button>
            </form>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Ask an owner or admin to enable Forms.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return children;
}
