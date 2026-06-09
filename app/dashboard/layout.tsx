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

  const { count: unreadMessagesCount, error: unreadMessagesError } = await supabase
    .from("internal_messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationContext.activeOrganization.id)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (unreadMessagesError) {
    console.error("[dashboard/layout] Could not load unread message count", {
      organizationId: organizationContext.activeOrganization.id,
      error: unreadMessagesError,
    });
  }

  return (
    <DashboardShell
      userId={user.id}
      userEmail={user.email ?? "Account"}
      organizationContext={organizationContext}
      newSubmissionsCount={newSubmissionsError ? 0 : newSubmissionsCount ?? 0}
      unreadMessagesCount={unreadMessagesError ? 0 : unreadMessagesCount ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
