import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, organizationContext, supabase } = await requireOrganizationContext();

  if (!organizationContext.activeOrganization.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const { count: newSubmissionsCount, error: newSubmissionsError } = await supabase
    .from("form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationContext.activeOrganization.id)
    .eq("read_status", "new");

  if (newSubmissionsError) {
    console.error("[dashboard/layout] Could not load unread form submission count", {
      organizationId: organizationContext.activeOrganization.id,
      error: newSubmissionsError,
    });
  }

  return (
    <DashboardShell
      userEmail={user.email ?? "Account"}
      organizationContext={organizationContext}
      newSubmissionsCount={newSubmissionsError ? 0 : newSubmissionsCount ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
