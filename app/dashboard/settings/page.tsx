import { ImageIcon, Palette, Settings } from "lucide-react";
import { OrganizationBrandingForm } from "@/components/dashboard/organization-branding-form";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";

export default async function SettingsPage() {
  const { organizationContext } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;
  const canEdit = canManageOrganization(activeMembership.role);
  const displayName = activeOrganization.displayName ?? activeOrganization.name;
  const logoUrl = activeOrganization.logoUrl ?? activeOrganization.avatarUrl;
  const accentColor = activeOrganization.accentColor ?? "#111827";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure organization profile, security defaults, module policy, localization, and workspace preferences."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start gap-4">
              <OrganizationAvatar
                name={displayName}
                avatarUrl={logoUrl}
                className="h-14 w-14"
              />
              <div>
                <CardTitle>Organization branding</CardTitle>
                <CardDescription>
                  Set the brand fields used across dashboards, scanner surfaces, and future uploaded logo support.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <OrganizationBrandingForm
            name={activeOrganization.name}
            displayName={activeOrganization.displayName}
            logoUrl={logoUrl}
            avatarUrl={activeOrganization.avatarUrl}
            accentColor={accentColor}
            organizationType={activeOrganization.organizationType}
            disabled={!canEdit}
            activeRole={activeMembership.role}
          />
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ backgroundColor: accentColor }}>
              <Palette className="h-5 w-5" />
            </div>
            <CardTitle>Brand preview</CardTitle>
            <CardDescription>
              A compact preview of how HofAdmin can present this organization in future member-facing flows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <OrganizationAvatar name={displayName} avatarUrl={logoUrl} className="h-12 w-12" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{activeOrganization.slug}</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>Organization scoped</Badge>
                <Badge>RLS ready</Badge>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logo URL prepared for uploaded assets.
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Type: {activeOrganization.organizationType ?? "Not set"}.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
