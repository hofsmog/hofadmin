import { InventorySettingsForm } from "@/components/dashboard/inventory/inventory-settings-form";
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences-form";
import { OrganizationBrandingForm } from "@/components/dashboard/organization-branding-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ notifications?: string }> }) {
  const params = (await searchParams) ?? {};
  const { organizationContext, supabase } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;
  const canEdit = canManageOrganization(activeMembership.role);
  const { data: notificationPreferences } = await supabase
    .from("organization_notification_preferences")
    .select("enable_email_notifications, notify_new_form_response, notify_loan_due_tomorrow, notify_loan_overdue, notify_new_member_added, notification_emails")
    .eq("organization_id", activeOrganization.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage workspace branding and simple module defaults."
      />
      <Toast show={params.notifications === "saved"} title="Notification settings saved" message="Email notification preferences were updated." />
      <Toast show={["error", "invalid-email", "denied"].includes(params.notifications ?? "")} tone="error" title="Notification settings not saved" message={params.notifications === "invalid-email" ? "Check the email address format and try again." : "You do not have permission or the settings could not be saved."} />
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
        <NotificationPreferencesForm
          preferences={notificationPreferences}
          disabled={!canEdit}
        />
      </div>
    </>
  );
}
