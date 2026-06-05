/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarClock, Car, Wrench } from "lucide-react";
import { createVehicleAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function VehiclesPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const soon = addDays(30);
  const [{ count: inspections }, { count: service }, { count: active }, { data: records }] = await Promise.all([
    db.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("inspection_date", soon),
    db.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).lte("next_service_date", soon),
    db.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    db.from("vehicles").select("id, name, registration_number, vin, status, next_service_date, inspection_date, insurance_date, notes, members(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdvancedRecordsPage
      title="Vehicles"
      description="Manage vehicle records, service dates, inspections, insurance, assignments, and notes."
      createTitle="Create vehicle"
      createDescription="Register the vehicle and the dates that need attention."
      listTitle="Vehicles"
      listDescription="Track status, service, inspection, and insurance dates."
      action={createVehicleAction}
      fields={[
        { name: "name", label: "Vehicle Name", required: true, placeholder: "Van 1" },
        { name: "registrationNumber", label: "Registration Number", placeholder: "ABC123" },
        { name: "vin", label: "VIN", placeholder: "Vehicle identification number" },
        { name: "status", label: "Status", type: "select", options: ["active", "in_service", "out_of_service"] },
        { name: "nextServiceDate", label: "Next Service Date", type: "date" },
        { name: "inspectionDate", label: "Inspection Date", type: "date" },
        { name: "insuranceDate", label: "Insurance Date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea", placeholder: "Optional vehicle notes" },
      ]}
      stats={[
        { label: "Upcoming Inspections", value: inspections ?? 0, detail: "Due within 30 days", icon: CalendarClock },
        { label: "Upcoming Service", value: service ?? 0, detail: "Service date within 30 days", icon: Wrench },
        { label: "Active Vehicle Bookings", value: active ?? 0, detail: "Active vehicle records", icon: Car },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No vehicles yet"
      emptyDescription="Register a vehicle to track service, inspection, and insurance dates."
      getRecordTitle={(record) => record.name}
      getRecordDescription={(record) => record.registration_number || record.vin || "No registration details"}
      getRecordMeta={(record) => `Service: ${record.next_service_date || "Not set"} - Inspection: ${record.inspection_date || "Not set"} - Insurance: ${record.insurance_date || "Not set"}`}
      getRecordStatus={(record) => record.status}
    />
  );
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
