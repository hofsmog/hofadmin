import { Clock3 } from "lucide-react";
import { manualCheckinAction } from "@/app/dashboard/modules/qr-checkins/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { qrNavItems } from "@/lib/module-nav";

export default async function QrCheckInsPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: qrItems }, { data: checkins }] = await Promise.all([
    supabase.from("qr_items").select("id, name, qr_value").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("checkins").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  const qrItemsById = new Map((qrItems ?? []).map((item) => [item.id, item]));

  return (
    <>
      <ModuleHeader title="Attendance" description="View scanned attendance and register manual check-ins." items={qrNavItems} />
      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Manual Attendance</CardTitle>
            <CardDescription>Add someone to attendance without scanning.</CardDescription>
          </CardHeader>
          <form action={manualCheckinAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Check-in point</span>
              <select name="qrItemId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800" required>
                <option value="">Select check-in point</option>
                {(qrItems ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Attendee</span>
              <Input name="attendeeName" placeholder="Alex Morgan" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Notes</span>
              <Input name="notes" placeholder="Manual front desk entry" />
            </label>
            <ActionSubmitButton className="h-11 w-full" pendingLabel="Registering">
              Add Attendance
            </ActionSubmitButton>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Latest scanned and manual attendance entries.</CardDescription>
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
                      <p className="text-sm font-medium">{qrItem?.name ?? "Unknown check-in point"}</p>
                      <span className="text-xs text-muted-foreground">{new Date(checkin.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {checkin.attendee_name ?? "Manual attendance"} {checkin.notes ? `- ${checkin.notes}` : ""}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No attendance recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
