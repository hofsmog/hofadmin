import { ScanLine } from "lucide-react";
import { QrScanner } from "@/components/dashboard/qr-scanner";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function QrScannerPage() {
  const { organizationContext } = await requireOrganizationContext();

  return (
    <>
      <PageHeader
        title="QR Scanner"
        description={`Scan organization QR codes and submit check-ins for ${organizationContext.activeOrganization.name}.`}
        actions={
          <ButtonLink href="/dashboard/modules/qr-checkins" variant="secondary">
            Back to QR module
          </ButtonLink>
        }
      />
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Hold the QR code inside the frame</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Check-ins submit automatically after a valid organization QR code is detected.
            </p>
          </div>
        </div>
      </div>
      <QrScanner organizationName={organizationContext.activeOrganization.name} />
    </>
  );
}
