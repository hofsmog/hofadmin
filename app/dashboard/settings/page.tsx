import { InventorySettingsForm } from "@/components/dashboard/inventory/inventory-settings-form";
import { OrganizationBrandingForm } from "@/components/dashboard/organization-branding-form";
import { PageHeader } from "@/components/dashboard/page-header";
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
        description="Manage workspace branding and simple module defaults."
      />
      <div className="space-y-6">
        <OrganizationBrandingForm
          values={{
            name: activeOrganization.name,
            displayName: activeOrganization.displayName,
            logoUrl: activeOrganization.logoUrl,
            avatarUrl: activeOrganization.avatarUrl,
            faviconUrl: activeOrganization.faviconUrl,
            accentColor: activeOrganization.accentColor,
            backgroundColor: activeOrganization.backgroundColor,
            sidebarStyle: activeOrganization.sidebarStyle,
            publicBrandingEnabled: activeOrganization.publicBrandingEnabled,
            customWelcomeMessage: activeOrganization.customWelcomeMessage,
            supportEmail: activeOrganization.supportEmail,
            websiteUrl: activeOrganization.websiteUrl,
            organizationType: activeOrganization.organizationType,
          }}
          disabled={!canEdit}
          activeRole={activeMembership.role}
        />
        <InventorySettingsForm
          defaultLoanAgreementText={activeOrganization.defaultLoanAgreementText}
          disabled={!canEdit}
        />
      </div>
    </>
  );
}
