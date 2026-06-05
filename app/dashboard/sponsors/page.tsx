/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarClock, Handshake, PiggyBank } from "lucide-react";
import { createSponsorAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function SponsorsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const soon = addDays(60);
  const [{ count: active }, { count: renewals }, { data: records }] = await Promise.all([
    db.from("sponsors").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    db.from("sponsors").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("renewal_date", soon),
    db.from("sponsors").select("id, name, sponsor_type, contact_person, email, sponsorship_value, renewal_date, status, notes, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);
  const totalValue = (records ?? []).reduce((sum: number, record: any) => sum + Number(record.sponsorship_value ?? 0), 0);
  return <AdvancedRecordsPage title="Sponsors" description="Manage sponsors, partners, agreements, renewal dates, values, notes, and documents." createTitle="Create sponsor or partner" createDescription="Add contact details, value, renewal date, and notes." listTitle="Sponsors and partners" listDescription="Active relationships and upcoming renewals." action={createSponsorAction} fields={[{ name: "name", label: "Name", required: true }, { name: "sponsorType", label: "Type", type: "select", options: ["sponsor", "partner"] }, { name: "contactPerson", label: "Contact Person" }, { name: "email", label: "Email" }, { name: "phone", label: "Phone" }, { name: "sponsorshipValue", label: "Sponsorship Value", type: "number" }, { name: "renewalDate", label: "Renewal Date", type: "date" }, { name: "agreementPath", label: "Agreement Path" }, { name: "notes", label: "Notes", type: "textarea" }]} stats={[{ label: "Active Sponsors", value: active ?? 0, detail: "Active relationships", icon: Handshake }, { label: "Upcoming Renewals", value: renewals ?? 0, detail: "Within 60 days", icon: CalendarClock }, { label: "Sponsorship Value", value: totalValue, detail: "Total listed value", icon: PiggyBank }]} records={records ?? []} params={params} emptyTitle="No sponsors yet" emptyDescription="Add a sponsor or partner to manage renewals and agreements." getRecordTitle={(record) => record.name} getRecordDescription={(record) => record.notes || record.contact_person || "No notes"} getRecordMeta={(record) => `Contact: ${record.contact_person || "Not set"} - Value: ${record.sponsorship_value ?? "Not set"} - Renewal: ${record.renewal_date || "Not set"}`} getRecordStatus={(record) => record.status} />;
}

function addDays(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
