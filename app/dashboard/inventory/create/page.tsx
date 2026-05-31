import { InventoryCreateForm } from "@/components/dashboard/inventory/inventory-create-form";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryCreatePage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: categories }, { data: members }] = await Promise.all([
    supabase.from("inventory_categories").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }),
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }),
  ]);

  return (
    <>
      <ModuleHeader title="Add Inventory Item" description="Create a tracked asset with assignment, condition, location, and QR readiness." items={inventoryNavItems} />
      <div className="mx-auto max-w-4xl">
        <InventoryCreateForm categories={categories ?? []} members={members ?? []} />
      </div>
    </>
  );
}
