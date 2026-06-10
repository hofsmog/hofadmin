import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getModulePermissionRows } from "@/lib/module-permissions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organizationContext, supabase } = await requireOrganizationContext();

  if (!organizationContext.activeOrganization.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const { count: unreadMessagesCount, error: unreadMessagesError } = await supabase
    .from("internal_messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationContext.activeOrganization.id)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (unreadMessagesError) {
    console.error("[app/layout] Could not load unread message count", {
      organizationId: organizationContext.activeOrganization.id,
      error: unreadMessagesError,
    });
  }

  const modulePermissionRows = await getModulePermissionRows(supabase, organizationContext.activeOrganization.id);

  return (
    <AppShell
      userId={user.id}
      userEmail={user.email ?? "Account"}
      organizationContext={organizationContext}
      unreadMessagesCount={unreadMessagesError ? 0 : unreadMessagesCount ?? 0}
      modulePermissionRows={modulePermissionRows}
    >
      {children}
    </AppShell>
  );
}
