import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getModulePermissionRows } from "@/lib/module-permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, organizationContext, supabase } = await requireOrganizationContext();

  if (!organizationContext.activeOrganization.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const modulePermissionRows = await getModulePermissionRows(supabase, organizationContext.activeOrganization.id);

  return (
    <DashboardShell
      userId={user.id}
      userEmail={user.email ?? "Account"}
      organizationContext={organizationContext}
      modulePermissionRows={modulePermissionRows}
    >
      {children}
    </DashboardShell>
  );
}
