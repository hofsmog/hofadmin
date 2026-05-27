import { ScanLine } from "lucide-react";
import { QrScanner } from "@/components/dashboard/qr-scanner";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function QrScannerPage() {
  const { organizationContext } = await requireOrganizationContext();

  return (
    <>
      <PageHeader
        title="QR Scanner"
        description={`Scan organization QR codes and submit check-ins for ${organizationContext.activeOrganization.name}.`}
      />
      <div className="mb-4 inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm dark:bg-zinc-950">
        <ScanLine className="h-4 w-4" />
        Auto-submit is enabled after every valid scan.
      </div>
      <QrScanner organizationName={organizationContext.activeOrganization.name} />
    </>
  );
}
