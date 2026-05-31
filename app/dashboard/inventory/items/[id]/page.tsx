import { notFound } from "next/navigation";
import { Calendar, MapPin, QrCode, UserRound } from "lucide-react";
import { updateInventoryItemStatusAction } from "@/app/dashboard/modules/inventory/actions";
import { InventoryConditionBadge, InventoryStatusBadge, inventoryConditionLabels, inventoryStatusLabels } from "@/components/dashboard/inventory/inventory-badges";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { QrCodeCard } from "@/components/dashboard/qr-code-card";
import { Toast } from "@/components/ui/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";
import type { InventoryItemCondition, InventoryItemStatus } from "@/types/database";

const statuses: InventoryItemStatus[] = ["available", "in_use", "maintenance", "lost", "retired"];
const conditions: InventoryItemCondition[] = ["new", "good", "fair", "poor", "broken"];

export default async function InventoryDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ updated?: string; error?: string }> }) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: item }, { data: members }, { data: events }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, description, asset_tag, serial_number, status, condition, location, assigned_to_member_id, qr_value, purchase_date, purchase_price, notes, created_at, inventory_categories(name, color)")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single(),
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }),
    supabase.from("inventory_events").select("id, event_type, note, created_at").eq("inventory_item_id", id).eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(10),
  ]);

  if (!item) notFound();
  const assignedMemberName = item.assigned_to_member_id ? members?.find((member) => member.id === item.assigned_to_member_id)?.name ?? "Unknown member" : "Unassigned";

  return (
    <>
      <ModuleHeader title={item.name} description="Inventory item detail, QR readiness, assignment, status, and event history." items={inventoryNavItems} />
      <Toast show={query.updated === "1"} title="Inventory item updated" message="Status, assignment, and notes were saved." />
      <Toast show={Boolean(query.error)} tone="error" title="Could not update item" message="Please review the details and try again." />
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description ?? "No description"}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2"><InventoryStatusBadge status={item.status} /><InventoryConditionBadge condition={item.condition} /></div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Info icon={QrCode} label="Asset tag" value={item.asset_tag ?? "No asset tag"} />
              <Info icon={QrCode} label="Serial number" value={item.serial_number ?? "No serial number"} />
              <Info icon={MapPin} label="Location" value={item.location ?? "No location"} />
              <Info icon={UserRound} label="Assigned to" value={assignedMemberName} />
              <Info icon={Calendar} label="Purchase date" value={item.purchase_date ?? "Not recorded"} />
              <Info icon={Calendar} label="Purchase price" value={item.purchase_price ? `${item.purchase_price}` : "Not recorded"} />
            </CardContent>
          </Card>

          {item.qr_value ? (
            <QrCodeCard
              organizationName={organizationContext.activeOrganization.name}
              item={{
                id: item.id,
                name: item.name,
                type: "asset",
                description: "Inventory QR value. Future scans can open this item detail.",
                qr_value: item.qr_value,
                is_active: item.status !== "retired",
                created_at: item.created_at,
              }}
            />
          ) : (
            <Card><CardHeader><CardTitle>No QR value yet</CardTitle><CardDescription>This item can receive an inventory QR value when edited or recreated with QR enabled.</CardDescription></CardHeader></Card>
          )}

          <Card>
            <CardHeader><CardTitle>Event history</CardTitle><CardDescription>Audit trail for inventory changes.</CardDescription></CardHeader>
            <div className="divide-y px-5 pb-5">
              {(events ?? []).length ? events?.map((event) => (
                <div key={event.id} className="py-3">
                  <p className="text-sm font-medium capitalize">{event.event_type.replaceAll("_", " ")}</p>
                  {event.note ? <p className="mt-1 text-sm text-muted-foreground">{event.note}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              )) : <p className="py-6 text-sm text-muted-foreground">No events yet.</p>}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Update item</CardTitle><CardDescription>Adjust handling status, assignment, location, and internal notes.</CardDescription></CardHeader>
          <CardContent>
            <form action={updateInventoryItemStatusAction} className="space-y-4">
              <input type="hidden" name="itemId" value={item.id} />
              <Select name="status" label="Status" defaultValue={item.status}>{statuses.map((status) => <option key={status} value={status}>{inventoryStatusLabels[status]}</option>)}</Select>
              <Select name="condition" label="Condition" defaultValue={item.condition}>{conditions.map((condition) => <option key={condition} value={condition}>{inventoryConditionLabels[condition]}</option>)}</Select>
              <Select name="assignedToMemberId" label="Assigned member" defaultValue={item.assigned_to_member_id ?? ""}><option value="">Unassigned</option>{(members ?? []).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select>
              <label className="block space-y-2"><span className="text-sm font-medium">Location</span><input name="location" defaultValue={item.location ?? ""} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Notes</span><textarea name="notes" defaultValue={item.notes ?? ""} rows={4} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Event note</span><input name="eventNote" placeholder="What changed?" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" /></label>
              <button type="submit" className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950">Save update</button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Select({ name, label, defaultValue, children }: { name: string; label: string; defaultValue: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><select name={name} defaultValue={defaultValue} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950">{children}</select></label>;
}

function Info({ icon: Icon, label, value }: { icon: typeof QrCode; label: string; value: string }) {
  return <div className="flex gap-3 rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-zinc-700 dark:bg-zinc-950"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="break-words text-sm font-medium">{value}</p></div></div>;
}
