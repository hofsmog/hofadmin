import { Activity } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryActivityPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const { data: events } = await supabase
    .from("inventory_events")
    .select("*, inventory_items(name, asset_tag)")
    .eq("organization_id", organizationContext.activeOrganization.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <ModuleHeader title="Inventory Activity" description="Audit trail for item creation, assignments, returns, locations, and status changes." items={inventoryNavItems} />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div><CardTitle>Activity log</CardTitle><CardDescription>Recent inventory events for this organization.</CardDescription></div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <div className="divide-y px-5 pb-5">
          {(events ?? []).length ? events?.map((event) => (
            <div key={event.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{event.inventory_items?.name ?? "Inventory item"}</p>
                <Badge className="capitalize">{event.event_type.replaceAll("_", " ")}</Badge>
              </div>
              {event.note ? <p className="mt-1 text-sm text-muted-foreground">{event.note}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{event.inventory_items?.asset_tag ?? "No asset tag"} - {new Date(event.created_at).toLocaleString()}</p>
            </div>
          )) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Activity className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-medium">No inventory events yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Events appear after items are created or updated.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
