import Link from "next/link";
import { Package, QrCode, Search } from "lucide-react";
import { InventoryConditionBadge, InventoryStatusBadge } from "@/components/dashboard/inventory/inventory-badges";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";
import type { InventoryItemCondition, InventoryItemStatus } from "@/types/database";

export default async function InventoryItemsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: InventoryItemStatus | "all"; condition?: InventoryItemCondition | "all"; category?: string; location?: string }>;
}) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").replace(/[%,()]/g, "").trim();
  const status = params.status ?? "all";
  const condition = params.condition ?? "all";
  const category = params.category ?? "all";
  const location = String(params.location ?? "").trim();
  let query = supabase
    .from("inventory_items")
    .select("id, name, asset_tag, status, condition, location, assigned_to_member_id, qr_value, updated_at, category_id, inventory_categories(name, color)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) query = query.or(`name.ilike.%${q}%,asset_tag.ilike.%${q}%,serial_number.ilike.%${q}%`);
  if (status !== "all") query = query.eq("status", status);
  if (condition !== "all") query = query.eq("condition", condition);
  if (category !== "all") query = query.eq("category_id", category);
  if (location) query = query.ilike("location", `%${location}%`);

  const [{ data: items }, { data: categories }, { data: members }] = await Promise.all([
    query,
    supabase.from("inventory_categories").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }),
    supabase.from("members").select("id, name").eq("organization_id", organizationId),
  ]);
  const membersById = new Map((members ?? []).map((member) => [member.id, member.name]));

  return (
    <>
      <ModuleHeader title="Inventory Items" description="Search, filter, and open tracked assets." items={inventoryNavItems} action={{ href: "/dashboard/inventory/create", label: "Add item" }} />
      <Card>
        <CardHeader>
          <CardTitle>Item list</CardTitle>
          <CardDescription>Filter by status, condition, category, location, and asset identifiers.</CardDescription>
        </CardHeader>
        <form className="grid gap-3 p-5 pt-0 md:grid-cols-[1fr_10rem_10rem_12rem_10rem_auto]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={q} placeholder="Search items" className="pl-9" /></div>
          <Select name="status" defaultValue={status}><option value="all">All status</option><option value="available">Available</option><option value="in_use">In use</option><option value="maintenance">Maintenance</option><option value="lost">Lost</option><option value="retired">Retired</option></Select>
          <Select name="condition" defaultValue={condition}><option value="all">All condition</option><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="broken">Broken</option></Select>
          <Select name="category" defaultValue={category}><option value="all">All categories</option>{(categories ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Input name="location" defaultValue={location} placeholder="Location" />
          <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950" type="submit">Filter</button>
        </form>
        <div className="space-y-3 p-5 pt-0">
          {(items ?? []).length ? items?.map((item) => (
            <Link key={item.id} href={`/dashboard/inventory/items/${item.id}`} className="block rounded-xl border bg-zinc-50 p-4 transition hover:bg-white hover:shadow-sm dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <InventoryStatusBadge status={item.status} />
                    <InventoryConditionBadge condition={item.condition} />
                    {item.qr_value ? <Badge><QrCode className="mr-1 h-3 w-3" />QR ready</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.asset_tag ?? "No asset tag"} - {item.inventory_categories?.name ?? "Uncategorized"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.location ?? "No location"} - {item.assigned_to_member_id ? membersById.get(item.assigned_to_member_id) ?? "Unknown member" : "Unassigned"}</p>
                </div>
                <span className="text-xs text-muted-foreground">Updated {new Date(item.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          )) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Package className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-medium">No inventory items found</p>
              <p className="mt-1 text-sm text-muted-foreground">Add an item or adjust the current filters.</p>
              <ButtonLink href="/dashboard/inventory/create" className="mt-4">Add item</ButtonLink>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function Select({ name, defaultValue, children }: { name: string; defaultValue: string; children: React.ReactNode }) {
  return <select name={name} defaultValue={defaultValue} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">{children}</select>;
}
