import { AlertTriangle, Boxes, ClipboardList, PackageCheck, PackagePlus } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryOverviewPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [
    { count: totalItems },
    { count: availableItems },
    { count: inUseItems },
    { count: maintenanceItems },
    { data: events },
  ] = await Promise.all([
    supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "available"),
    supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "in_use"),
    supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["maintenance", "lost"]),
    supabase.from("inventory_events").select("*, inventory_items(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(6),
  ]);

  return (
    <>
      <ModuleHeader
        title="Inventory"
        description="Track equipment, devices, kits, tools, keys, and QR-ready assets across your organization."
        items={inventoryNavItems}
        action={{ href: "/dashboard/inventory/create", label: "Add item" }}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total items" value={`${totalItems ?? 0}`} detail="Tracked assets" icon={Boxes} />
        <StatCard label="Available" value={`${availableItems ?? 0}`} detail="Ready to assign" icon={PackageCheck} />
        <StatCard label="In use" value={`${inUseItems ?? 0}`} detail="Assigned or checked out" icon={ClipboardList} />
        <StatCard label="Needs attention" value={`${maintenanceItems ?? 0}`} detail="Maintenance or lost" icon={AlertTriangle} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Recent inventory activity</CardTitle>
            <CardDescription>Latest item changes, assignments, returns, and maintenance notes.</CardDescription>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(events ?? []).length ? events?.map((event) => (
              <div key={event.id} className="py-3">
                <p className="text-sm font-medium">{event.inventory_items?.name ?? "Inventory item"} - {event.event_type.replaceAll("_", " ")}</p>
                {event.note ? <p className="mt-1 text-sm text-muted-foreground">{event.note}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
              </div>
            )) : <EmptyState />}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Start with the inventory flows most teams need first.</CardDescription>
          </CardHeader>
          <div className="grid gap-3 p-5 pt-0">
            <ButtonLink href="/dashboard/inventory/create" className="justify-start"><PackagePlus className="h-4 w-4" />Add item</ButtonLink>
            <ButtonLink href="/dashboard/inventory/items" variant="secondary" className="justify-start">View items</ButtonLink>
            <ButtonLink href="/dashboard/inventory/categories" variant="secondary" className="justify-start">Create category</ButtonLink>
          </div>
        </Card>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <Boxes className="mx-auto h-9 w-9 text-muted-foreground" />
      <p className="mt-3 font-medium">No inventory activity yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Add your first inventory item to begin the audit trail.</p>
    </div>
  );
}
