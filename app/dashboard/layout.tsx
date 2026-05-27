import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, organizationContext } = await requireOrganizationContext();

  return (
    <DashboardShell
      userEmail={user.email ?? "Account"}
      organizationContext={organizationContext}
    >
      {children}
    </DashboardShell>
  );
}
