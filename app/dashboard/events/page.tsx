/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarCheck, ClipboardList, UserCheck } from "lucide-react";
import { createEventAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function EventsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const [{ count: upcoming }, { count: registrations }, { count: thisWeek }, { data: records }] = await Promise.all([
    db.from("events").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("start_at", now.toISOString()),
    db.from("event_registrations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("events").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("start_at", now.toISOString()).lte("start_at", weekEnd.toISOString()),
    db.from("events").select("id, title, description, start_at, end_at, location, capacity, registration_deadline, status").eq("organization_id", organizationId).order("start_at", { ascending: true }).limit(50),
  ]);

  return <AdvancedRecordsPage title="Events" description="Create events, manage registrations, waiting lists, attendance, QR check-ins, and documents." createTitle="Create event" createDescription="Add the event details and registration limits." listTitle="Events" listDescription="Upcoming and recent events." action={createEventAction} fields={[{ name: "title", label: "Event Title", required: true }, { name: "description", label: "Description", type: "textarea" }, { name: "startAt", label: "Start Date", type: "datetime-local", required: true }, { name: "endAt", label: "End Date", type: "datetime-local" }, { name: "location", label: "Location" }, { name: "capacity", label: "Capacity", type: "number" }, { name: "registrationDeadline", label: "Registration Deadline", type: "datetime-local" }, { name: "status", label: "Status", type: "select", options: ["draft", "published", "ongoing", "completed", "cancelled"] }]} stats={[{ label: "Upcoming Events", value: upcoming ?? 0, detail: "Events from today onward", icon: CalendarCheck }, { label: "New Registrations", value: registrations ?? 0, detail: "Total registrations", icon: UserCheck }, { label: "Events This Week", value: thisWeek ?? 0, detail: "Starting within 7 days", icon: ClipboardList }]} records={records ?? []} params={params} emptyTitle="No events yet" emptyDescription="Create your first event to manage registrations and attendance." getRecordTitle={(record) => record.title} getRecordDescription={(record) => record.description || record.location || "No description"} getRecordMeta={(record) => `${new Date(record.start_at).toLocaleString()} - Capacity: ${record.capacity ?? "No limit"} - Deadline: ${record.registration_deadline ? new Date(record.registration_deadline).toLocaleDateString() : "Not set"}`} getRecordStatus={(record) => record.status} />;
}
