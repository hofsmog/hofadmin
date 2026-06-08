import { ScanLine } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { QrScanner } from "@/components/dashboard/qr-scanner";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { qrNavItems } from "@/lib/module-nav";

export default async function QrScannerNewPage() {
  const { organizationContext } = await requireOrganizationContext();

  return (
    <>
      <ModuleHeader
        title="Attendance Scanner"
        description={`Scan a check-in point QR code to record attendance for ${organizationContext.activeOrganization.name}.`}
        items={qrNavItems}
      />
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Hold the check-in QR code inside the frame</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Attendance is recorded automatically after a valid check-in point is detected.</p>
          </div>
        </div>
      </div>
      <QrScanner organizationName={organizationContext.activeOrganization.name} />
    </>
  );
}
