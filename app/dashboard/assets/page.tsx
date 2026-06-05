/* eslint-disable @typescript-eslint/no-explicit-any */

import { AlertTriangle, CalendarClock, PackageCheck, Wrench } from "lucide-react";
import { createAssetLifecycleEventAction, updateAssetLifecycleAction } from "@/app/dashboard/advanced/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

const lifecycleStatuses = ["in_stock", "active", "loaned", "in_repair", "retired", "lost", "disposed"];
const eventTypes = ["service", "repair", "warranty", "replacement", "retired", "disposed"];

export default async function AssetLifecyclePage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const today = new Date();
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 60);

  const [
    { count: warrantyExpiring },
    { count: dueForReplacement },
    { count: inRepair },
    { data: assets },
    { data: lifecycleEvents },
  ] = await Promise.all([
    db.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("warranty_expiration", today.toISOString().slice(0, 10)).lte("warranty_expiration", soon.toISOString().slice(0, 10)),
    db.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("expected_replacement_date", soon.toISOString().slice(0, 10)),
    db.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("lifecycle_status", "in_repair"),
    db.from("inventory_items").select("id, name, asset_tag, serial_number, model, manufacturer, supplier, purchase_date, purchase_price, warranty_expiration, expected_replacement_date, lifecycle_status, condition").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(50),
    db.from("asset_lifecycle_events").select("id, title, event_type, event_date, cost, notes, inventory_items(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <>
      <PageHeader title="Asset Lifecycle" description="Track warranty, service, repair, replacement, and retirement history for inventory assets." />
      <Toast show={params.created === "1"} title="Lifecycle event added" message="The asset timeline was updated." />
      <Toast show={params.updated === "1"} title="Asset lifecycle updated" message="Asset lifecycle details were saved." />
      <Toast show={Boolean(params.error)} tone="error" title="Asset update failed" message="Check the asset details and try again." />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Warranty Expiring Soon" value={`${warrantyExpiring ?? 0}`} detail="Within the next 60 days" icon={CalendarClock} />
        <StatCard label="Assets Due For Replacement" value={`${dueForReplacement ?? 0}`} detail="Planned replacement date is close" icon={AlertTriangle} />
        <StatCard label="Assets In Repair" value={`${inRepair ?? 0}`} detail="Currently marked in repair" icon={Wrench} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[26rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Update asset lifecycle</CardTitle>
            <CardDescription>Add lifecycle details to an existing inventory item.</CardDescription>
          </CardHeader>
          <form action={updateAssetLifecycleAction} className="space-y-4 p-5 pt-0">
            <Select name="itemId" label="Asset" options={(assets ?? []).map((item: any) => ({ value: item.id, label: item.name }))} />
            <InputGroup name="manufacturer" label="Manufacturer" placeholder="Apple, Dell, Lenovo" />
            <InputGroup name="model" label="Model" placeholder="MacBook Air M2" />
            <InputGroup name="supplier" label="Supplier" placeholder="Supplier name" />
            <Select name="lifecycleStatus" label="Asset Status" options={lifecycleStatuses.map((status) => ({ value: status, label: labelize(status) }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <InputGroup name="warrantyExpiration" label="Warranty Expiration" type="date" />
              <InputGroup name="expectedReplacementDate" label="Expected Replacement Date" type="date" />
            </div>
            <InputGroup name="endOfLifeDate" label="End-of-Life Date" type="date" />
            <label className="block space-y-2">
              <span className="text-sm font-medium">Notes</span>
              <textarea name="notes" rows={3} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm dark:bg-zinc-950" />
            </label>
            <Button type="submit" className="w-full">Save lifecycle details</Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Recent inventory items with lifecycle details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(assets ?? []).length ? assets.map((item: any) => (
                <article key={item.id} className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.manufacturer || "No manufacturer"} {item.model || ""}</p>
                    </div>
                    <Badge>{labelize(item.lifecycle_status ?? "active")}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                    <span>Serial: {item.serial_number || "Not set"}</span>
                    <span>Warranty: {item.warranty_expiration || "Not set"}</span>
                    <span>Replacement: {item.expected_replacement_date || "Not set"}</span>
                  </div>
                </article>
              )) : <Empty title="No inventory assets yet" description="Add inventory items first, then manage their lifecycle here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add service or repair history</CardTitle>
              <CardDescription>Record work that should appear on the asset timeline.</CardDescription>
            </CardHeader>
            <form action={createAssetLifecycleEventAction} className="grid gap-4 p-5 pt-0 md:grid-cols-2">
              <Select name="itemId" label="Asset" options={(assets ?? []).map((item: any) => ({ value: item.id, label: item.name }))} />
              <Select name="eventType" label="Event Type" options={eventTypes.map((type) => ({ value: type, label: labelize(type) }))} />
              <InputGroup name="title" label="Title" placeholder="Battery replacement" />
              <InputGroup name="eventDate" label="Event Date" type="date" />
              <InputGroup name="cost" label="Cost" type="number" placeholder="0.00" />
              <InputGroup name="supplier" label="Supplier" placeholder="Repair shop or supplier" />
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Notes</span>
                <textarea name="notes" rows={3} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm dark:bg-zinc-950" />
              </label>
              <Button type="submit" className="md:col-span-2">Add timeline event</Button>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset timeline</CardTitle>
              <CardDescription>Latest lifecycle events across assets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(lifecycleEvents ?? []).length ? lifecycleEvents.map((event: any) => (
                <article key={event.id} className="rounded-xl border bg-white p-4 dark:bg-zinc-950">
                  <div className="flex flex-wrap items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{event.title}</p>
                    <Badge>{labelize(event.event_type)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{event.inventory_items?.name ?? "Asset"} - {event.event_date}{event.cost ? ` - ${event.cost}` : ""}</p>
                  {event.notes ? <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p> : null}
                </article>
              )) : <Empty title="No lifecycle history yet" description="Service, repair, and replacement events will appear here." />}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function InputGroup({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><Input name={name} type={type} placeholder={placeholder} /></label>;
}

function Select({ name, label, options }: { name: string; label: string; options: Array<{ value: string; label: string }> }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><select name={name} required className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Empty({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
