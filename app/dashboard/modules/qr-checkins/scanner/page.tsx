import { Camera, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function QrScannerPage() {
  const { organizationContext } = await requireOrganizationContext();

  return (
    <>
      <PageHeader
        title="QR Scanner"
        description={`Scanner workspace prepared for ${organizationContext.activeOrganization.name}. Camera scanning can be connected in the next module phase.`}
      />
      <Card className="grid min-h-[28rem] place-items-center p-8 text-center">
        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <ScanLine className="h-7 w-7" />
          </div>
          <CardHeader className="p-0 pt-5">
            <CardTitle>Scanner placeholder</CardTitle>
            <CardDescription>
              This area is ready for camera permissions, QR decoding, duplicate prevention, and offline-safe capture.
            </CardDescription>
          </CardHeader>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm dark:bg-zinc-950">
            <Camera className="h-4 w-4" />
            Camera integration pending
          </div>
        </div>
      </Card>
    </>
  );
}
