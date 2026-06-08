import { Plus, QrCode } from "lucide-react";
import { createQrItemAction } from "@/app/dashboard/modules/qr-checkins/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { QrCodeCard } from "@/components/dashboard/qr-code-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";
import { qrNavItems } from "@/lib/module-nav";

export default async function QrItemsPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;
  const canCreateQr = canManageOrganization(activeMembership.role);
  const { data: qrItems } = await supabase
    .from("qr_items")
    .select("*")
    .eq("organization_id", activeOrganization.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <ModuleHeader
        title="Check-in Points"
        description="Create QR codes for real attendance moments like Football Training, Summer Camp, Main Entrance, or School Event."
        items={qrNavItems}
        action={{ href: "#create-qr", label: "Create Check-in Point" }}
      />

      <div className="space-y-4">
        <Card id="create-qr">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Create Check-in Point</CardTitle>
                <CardDescription>Create a QR code people can scan to record attendance for an event, activity, or entrance.</CardDescription>
              </div>
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <form action={createQrItemAction} className="grid gap-4 p-5 pt-0 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Name</span>
              <Input name="name" placeholder="Football Training" disabled={!canCreateQr} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Check-in type</span>
              <select name="type" disabled={!canCreateQr} defaultValue="general" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
                <option value="general">General check-in</option>
                <option value="event">Event or activity</option>
                <option value="location">Entrance or location</option>
                <option value="member">Member check-in</option>
                <option value="asset">Asset scan</option>
              </select>
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Description</span>
              <Input name="description" placeholder="Used for Tuesday evening attendance" disabled={!canCreateQr} />
            </label>
            <div className="md:col-span-2">
              <ActionSubmitButton pendingLabel="Generating" disabled={!canCreateQr}>
                Create Check-in Point
              </ActionSubmitButton>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Check-in Point List</CardTitle>
                <CardDescription>Download or print QR cards for your attendance points.</CardDescription>
              </div>
              <QrCode className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="space-y-3 p-5 pt-0">
            {(qrItems ?? []).length ? (
              qrItems?.map((item) => <QrCodeCard key={item.id} item={item} organizationName={activeOrganization.name} />)
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <QrCode className="mx-auto h-9 w-9 text-muted-foreground" />
                <p className="mt-3 font-medium">No check-in points yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Create one for Football Training, Summer Camp, Main Entrance, or School Event.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
