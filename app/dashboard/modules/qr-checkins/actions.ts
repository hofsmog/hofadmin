"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";
import type { QrItemType } from "@/types/database";

const validQrTypes = new Set<QrItemType>(["general", "event", "member", "asset", "location"]);

export async function createQrItemAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();

  if (!canManageOrganization(organizationContext.activeMembership.role)) {
    throw new Error("Only owners and admins can create QR items.");
  }

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "general") as QrItemType;
  const description = String(formData.get("description") || "").trim() || null;

  if (name.length < 2 || name.length > 120) {
    throw new Error("QR item name must be between 2 and 120 characters.");
  }

  if (!validQrTypes.has(type)) {
    throw new Error("Invalid QR item type.");
  }

  const { error } = await supabase.from("qr_items").insert({
    organization_id: organizationContext.activeOrganization.id,
    name,
    type,
    description,
    qr_value: createQrValue(organizationContext.activeOrganization.id),
    created_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/modules/qr-checkins");
}

export async function manualCheckinAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const qrItemId = String(formData.get("qrItemId") || "");
  const attendeeName = String(formData.get("attendeeName") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!qrItemId) {
    throw new Error("Select a QR item.");
  }

  const { data: qrItem, error: qrItemError } = await supabase
    .from("qr_items")
    .select("id, qr_value")
    .eq("id", qrItemId)
    .eq("organization_id", organizationContext.activeOrganization.id)
    .single();

  if (qrItemError || !qrItem) {
    throw new Error("QR item could not be found for this organization.");
  }

  const { error } = await supabase.from("checkins").insert({
    organization_id: organizationContext.activeOrganization.id,
    qr_item_id: qrItem.id,
    checkin_value: qrItem.qr_value,
    attendee_name: attendeeName,
    notes,
    checked_in_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/modules/qr-checkins");
}

function createQrValue(organizationId: string) {
  return `hofadmin:qr:${organizationId}:${crypto.randomUUID()}`;
}
