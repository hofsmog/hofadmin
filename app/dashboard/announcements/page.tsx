/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarClock, Megaphone, Pin } from "lucide-react";
import { createAnnouncementAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function AnnouncementsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: active }, { count: scheduled }, { count: pinned }, { data: records }] = await Promise.all([
    db.from("announcements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "published"),
    db.from("announcements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "scheduled"),
    db.from("announcements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("pinned", true),
    db.from("announcements").select("id, title, content, target_audience, status, pinned, publish_at, expires_at, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return <AdvancedRecordsPage title="Announcements" description="Publish announcements, schedule updates, pin important messages, and track reads." createTitle="Create announcement" createDescription="Write a clear announcement for the right audience." listTitle="Announcements" listDescription="Draft, scheduled, and published announcements." action={createAnnouncementAction} fields={[{ name: "title", label: "Title", required: true }, { name: "content", label: "Content", type: "textarea" }, { name: "targetAudience", label: "Target Audience", placeholder: "All members, Staff, Volunteers" }, { name: "status", label: "Status", type: "select", options: ["draft", "scheduled", "published", "archived"] }, { name: "publishAt", label: "Publish At", type: "datetime-local" }, { name: "expiresAt", label: "Expiration Date", type: "datetime-local" }, { name: "pinned", label: "Pin announcement", type: "checkbox", description: "Keep this announcement visible at the top." }]} stats={[{ label: "Active Announcements", value: active ?? 0, detail: "Currently published", icon: Megaphone }, { label: "Scheduled Announcements", value: scheduled ?? 0, detail: "Waiting to publish", icon: CalendarClock }, { label: "Pinned Announcements", value: pinned ?? 0, detail: "Pinned for visibility", icon: Pin }]} records={records ?? []} params={params} emptyTitle="No announcements yet" emptyDescription="Create an announcement to communicate with your organization." getRecordTitle={(record) => record.title} getRecordDescription={(record) => record.content || record.target_audience || "No content"} getRecordMeta={(record) => `Audience: ${record.target_audience || "All"} - Publish: ${record.publish_at ? new Date(record.publish_at).toLocaleString() : "Not scheduled"} - Expires: ${record.expires_at ? new Date(record.expires_at).toLocaleDateString() : "Not set"}`} getRecordStatus={(record) => record.status} />;
}
