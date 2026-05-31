import { ScanLine } from "lucide-react";
import { InventoryQrScanner } from "@/components/dashboard/inventory/inventory-qr-scanner";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryScanPage() {
  const { organizationContext } = await requireOrganizationContext();

  return (
    <>
      <ModuleHeader
        title="Scan Inventory QR"
        description="Scan an inventory label to open the matching item detail page."
        items={inventoryNavItems}
      />
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Hold the inventory QR inside the frame</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">If the QR belongs to this organization, HofAdmin opens the item automatically.</p>
          </div>
        </div>
      </div>
      <InventoryQrScanner organizationName={organizationContext.activeOrganization.name} />
    </>
  );
}
