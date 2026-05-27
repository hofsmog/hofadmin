import { Clock3, Plus, QrCode, ScanLine } from "lucide-react";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QrCodeCard } from "@/components/dashboard/qr-code-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";
import { createQrItemAction, manualCheckinAction } from "@/app/dashboard/modules/qr-checkins/actions";

export default async function QrCheckinsPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const { activeOrganization, activeMembership } = organizationContext;
  const canCreateQr = canManageOrganization(activeMembership.role);

  const [{ data: qrItems }, { data: checkins }, { data: activityEvents }] = await Promise.all([
    supabase
      .from("qr_items")
      .select("*")
      .eq("organization_id", activeOrganization.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("checkins")
      .select("*")
      .eq("organization_id", activeOrganization.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_events")
      .select("id, type, title, description, created_at")
      .eq("organization_id", activeOrganization.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const qrItemsById = new Map((qrItems ?? []).map((item) => [item.id, item]));

  return (
    <>
      <PageHeader
        title="QR + Check-ins"
        description={`Generate QR access points and capture check-ins for ${activeOrganization.name}.`}
        actions={
          <ButtonLink href="/dashboard/modules/qr-checkins/scanner" variant="secondary">
            <ScanLine className="h-4 w-4" />
            Scanner
          </ButtonLink>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Card id="create-qr">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Create QR item</CardTitle>
                  <CardDescription>
                    Create reusable QR targets for classes, events, venues, assets, members, or access points.
                  </CardDescription>
                </div>
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <form action={createQrItemAction} className="grid gap-4 p-5 pt-0 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Name</span>
                <Input name="name" placeholder="Main entrance" disabled={!canCreateQr} required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Type</span>
                <select
                  name="type"
                  disabled={!canCreateQr}
                  defaultValue="general"
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 disabled:opacity-60 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                >
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="member">Member</option>
                  <option value="asset">Asset</option>
                  <option value="location">Location</option>
                </select>
              </label>
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Description</span>
                <Input name="description" placeholder="Used for arrival check-ins during events" disabled={!canCreateQr} />
              </label>
              <div className="md:col-span-2">
                <ActionSubmitButton pendingLabel="Generating" disabled={!canCreateQr}>
                  Generate QR value
                </ActionSubmitButton>
                {!canCreateQr ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your role is {activeMembership.role}. Only owners and admins can create QR items.
                  </p>
                ) : null}
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>QR items</CardTitle>
                  <CardDescription>Downloadable QR cards with stable organization-scoped values.</CardDescription>
                </div>
                <QrCode className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <div className="space-y-3 p-5 pt-0">
              {(qrItems ?? []).length ? (
                qrItems?.map((item) => (
                  <QrCodeCard key={item.id} item={item} organizationName={activeOrganization.name} />
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <QrCode className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 font-medium">No QR items yet</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Create the first access point to generate a printable QR card.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <ActivityFeed events={activityEvents ?? []} title="Module activity" description="QR, scanner, invite, and settings activity for this organization." />

          <Card>
            <CardHeader>
              <CardTitle>Manual check-in</CardTitle>
              <CardDescription>Register a check-in without scanning while staff workflows are being built.</CardDescription>
            </CardHeader>
            <form action={manualCheckinAction} className="space-y-4 p-5 pt-0">
              <label className="block space-y-2">
                <span className="text-sm font-medium">QR item</span>
                <select
                  name="qrItemId"
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  required
                >
                  <option value="">Select item</option>
                  {(qrItems ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Attendee or note label</span>
                <Input name="attendeeName" placeholder="Alex Morgan" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Notes</span>
                <Input name="notes" placeholder="Manual front desk entry" />
              </label>
              <ActionSubmitButton className="h-11 w-full" pendingLabel="Registering">
                Register check-in
              </ActionSubmitButton>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Check-in history</CardTitle>
                  <CardDescription>Latest organization-scoped activity.</CardDescription>
                </div>
                <Clock3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <div className="divide-y px-5 pb-5">
              {(checkins ?? []).length ? (
                checkins?.map((checkin) => {
                  const qrItem = checkin.qr_item_id ? qrItemsById.get(checkin.qr_item_id) : null;

                  return (
                    <div key={checkin.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{qrItem?.name ?? "Unknown QR item"}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(checkin.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {checkin.attendee_name ?? "Manual check-in"} {checkin.notes ? `- ${checkin.notes}` : ""}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="py-4 text-sm text-muted-foreground">No check-ins recorded yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
