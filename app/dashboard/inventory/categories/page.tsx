import { FolderPlus } from "lucide-react";
import { createInventoryCategoryAction, updateInventoryCategoryAction } from "@/app/dashboard/modules/inventory/actions";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryCategoriesPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("inventory_categories").select("id, name, description, color").eq("organization_id", organizationId).order("name", { ascending: true }),
    supabase.from("inventory_items").select("id, category_id").eq("organization_id", organizationId),
  ]);
  const itemCounts = new Map<string, number>();
  for (const item of items ?? []) {
    if (item.category_id) itemCounts.set(item.category_id, (itemCounts.get(item.category_id) ?? 0) + 1);
  }

  return (
    <>
      <ModuleHeader title="Inventory Categories" description="Group assets by device type, equipment class, location, or team use." items={inventoryNavItems} />
      <Toast show={params.created === "1"} title="Category created" message="Inventory category is ready to use." />
      <Toast show={params.updated === "1"} title="Category updated" message="Inventory category details were saved." />
      <Toast show={Boolean(params.error)} tone="error" title="Category not saved" message="Check the category details and try again." />
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardHeader><CardTitle>Create category</CardTitle><CardDescription>Use color to make categories scannable.</CardDescription></CardHeader>
          <form action={createInventoryCategoryAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Name</span><Input name="name" required placeholder="Laptops" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Description</span><Input name="description" placeholder="Student and staff laptops" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Color</span><div className="flex gap-2"><input type="color" name="color" defaultValue="#2563eb" className="h-11 w-12 rounded-xl border bg-white p-1" /><Input name="colorText" defaultValue="#2563eb" disabled /></div></label>
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"><FolderPlus className="h-4 w-4" />Create category</button>
          </form>
        </Card>
        <Card>
          <CardHeader><CardTitle>Categories</CardTitle><CardDescription>Inventory groups and item counts.</CardDescription></CardHeader>
          <div className="space-y-3 p-5 pt-0">
            {(categories ?? []).length ? categories?.map((category) => (
              <article key={category.id} className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} /><h3 className="font-semibold">{category.name}</h3></div>
                    {category.description ? <p className="mt-1 text-sm text-muted-foreground">{category.description}</p> : null}
                  </div>
                  <Badge>{itemCounts.get(category.id) ?? 0} items</Badge>
                </div>
                <form action={updateInventoryCategoryAction} className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-[1fr_1fr_6rem_auto]">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <Input name="name" defaultValue={category.name} aria-label="Category name" />
                  <Input name="description" defaultValue={category.description ?? ""} aria-label="Category description" />
                  <input type="color" name="color" defaultValue={category.color} aria-label="Category color" className="h-11 w-full rounded-xl border bg-white p-1 dark:bg-zinc-950" />
                  <button type="submit" className="h-11 rounded-xl border bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                    Save
                  </button>
                </form>
              </article>
            )) : <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">No categories yet</p><p className="mt-1 text-sm text-muted-foreground">Create a category to organize inventory items.</p></div>}
          </div>
        </Card>
      </div>
    </>
  );
}
