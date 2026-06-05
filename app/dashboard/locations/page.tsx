/* eslint-disable @typescript-eslint/no-explicit-any */

import { Building2, DoorOpen, MapPin } from "lucide-react";
import { createLocationAction } from "@/app/dashboard/advanced/actions";
import { AdvancedRecordsPage } from "@/components/dashboard/advanced-records-page";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function LocationsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: total }, { count: rooms }, { count: buildings }, { data: records }] = await Promise.all([
    db.from("locations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("locations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("location_type", "room"),
    db.from("locations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("location_type", "building"),
    db.from("locations").select("id, name, location_type, building, floor, room, description, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdvancedRecordsPage
      title="Locations"
      description="Structure locations, buildings, floors, and rooms for assets, bookings, issues, and visitors."
      createTitle="Create location"
      createDescription="Add a simple location record. More hierarchy can be added later."
      listTitle="Locations"
      listDescription="Use locations across inventory, fault reports, bookings, visitors, and checklists."
      action={createLocationAction}
      fields={[
        { name: "name", label: "Name", required: true, placeholder: "Main Office" },
        { name: "locationType", label: "Type", type: "select", options: ["location", "building", "floor", "room"] },
        { name: "building", label: "Building", placeholder: "Building A" },
        { name: "floor", label: "Floor", placeholder: "2" },
        { name: "room", label: "Room", placeholder: "204" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Optional location notes" },
      ]}
      stats={[
        { label: "Location Overview", value: total ?? 0, detail: "Total location records", icon: MapPin },
        { label: "Buildings", value: buildings ?? 0, detail: "Building records", icon: Building2 },
        { label: "Rooms", value: rooms ?? 0, detail: "Room records", icon: DoorOpen },
      ]}
      records={records ?? []}
      params={params}
      emptyTitle="No locations yet"
      emptyDescription="Create your first location to organize assets, bookings, issues, and visitors."
      getRecordTitle={(record) => record.name}
      getRecordDescription={(record) => record.description || `${record.building || "No building"} ${record.floor ? `- Floor ${record.floor}` : ""} ${record.room ? `- Room ${record.room}` : ""}`}
      getRecordMeta={(record) => `Type: ${record.location_type} - Created: ${new Date(record.created_at).toLocaleDateString()}`}
      getRecordStatus={(record) => record.location_type}
    />
  );
}
