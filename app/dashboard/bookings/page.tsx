import { CalendarDays } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBookingAction } from "@/app/dashboard/operations/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function BookingsPage({ searchParams }: { searchParams?: Promise<{ created?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const [{ data: bookings }, { data: members }] = await Promise.all([
    db.from("bookings").select("id, resource_name, resource_type, start_at, end_at, status, notes, members(name)").eq("organization_id", organizationId).order("start_at", { ascending: true }).limit(50),
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
  ]);
  return (
    <>
      <PageHeader title="Bookings" description="Book rooms, equipment, vehicles, keys, projectors, and shared resources." />
      <Toast show={params.created === "1"} title="Booking created" message="The resource booking was saved." />
      <Toast show={params.error === "conflict"} tone="error" title="Resource unavailable" message="That resource already has a booking during the selected time." />
      <Toast show={Boolean(params.error && params.error !== "conflict")} tone="error" title="Booking not saved" message="Check the booking details and try again." />
      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card><CardHeader><CardTitle>Create booking</CardTitle><CardDescription>Availability is checked for the same resource name.</CardDescription></CardHeader>
          <form action={createBookingAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Resource</span><Input name="resourceName" required placeholder="Conference Room A" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Resource type</span><Input name="resourceType" placeholder="Room, Equipment, Vehicle" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Start</span><Input name="startAt" type="datetime-local" required /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">End</span><Input name="endAt" type="datetime-local" required /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Responsible person</span><select name="responsibleMemberId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">No person</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Notes</span><Input name="notes" placeholder="Optional note" /></label>
            <button className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Create booking</button>
          </form>
        </Card>
        <Card><CardHeader><CardTitle>Upcoming bookings</CardTitle><CardDescription>Calendar-style list view for now.</CardDescription></CardHeader>
          <div className="divide-y px-5 pb-5">
            {(bookings ?? []).length ? bookings.map((booking: any) => <article key={booking.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{booking.resource_name}</p><Badge className="capitalize">{booking.status}</Badge><Badge>{booking.resource_type}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{new Date(booking.start_at).toLocaleString()} - {new Date(booking.end_at).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{booking.members?.name || "No responsible person"}</p></article>) : <Empty />}
          </div>
        </Card>
      </div>
    </>
  );
}

function Empty() { return <div className="rounded-xl border border-dashed p-8 text-center"><CalendarDays className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No bookings yet</p><p className="mt-1 text-sm text-muted-foreground">Create a booking to reserve a shared resource.</p></div>; }
