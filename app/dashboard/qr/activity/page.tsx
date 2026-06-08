import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { qrNavItems } from "@/lib/module-nav";

export default async function QrActivityPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const { data: activityEvents } = await supabase
    .from("activity_events")
    .select("id, type, title, description, created_at")
    .eq("organization_id", organizationContext.activeOrganization.id)
    .in("type", ["qr_created", "checkin_created"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <ModuleHeader title="Check-in Activity" description="Check-in point creation and attendance events for this organization." items={qrNavItems} />
      <ActivityFeed events={activityEvents ?? []} title="Check-in activity" description="Check-in point and attendance events." />
    </>
  );
}
