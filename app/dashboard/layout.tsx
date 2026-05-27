import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, organizationContext } = await requireOrganizationContext();

  if (!organizationContext.activeOrganization.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      userEmail={user.email ?? "Account"}
      organizationContext={organizationContext}
    >
      {children}
    </DashboardShell>
  );
}
