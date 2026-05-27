"use server";

import { revalidatePath } from "next/cache";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";
import type { QrItemType } from "@/types/database";

const validQrTypes = new Set<QrItemType>(["general", "event", "member", "asset", "location"]);

export type ScannerActionState = {
  status: "idle" | "success" | "error";
  message: string;
  itemName?: string;
};

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

  const qrValue = createQrValue(organizationContext.activeOrganization.id);
  const { data: qrItem, error } = await supabase
    .from("qr_items")
    .insert({
      organization_id: organizationContext.activeOrganization.id,
      name,
      type,
      description,
      qr_value: qrValue,
      created_by: user.id,
    })
    .select("id, name, type")
    .single();

  if (error || !qrItem) {
    throw new Error(error?.message ?? "QR item could not be created.");
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: "qr_created",
    title: "QR created",
    description: `${qrItem.name} was created as a ${qrItem.type} QR item.`,
    actorId: user.id,
    metadata: { qrItemId: qrItem.id, qrValue },
  });

  revalidatePath("/dashboard/modules/qr-checkins");
  revalidatePath("/dashboard");
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

  const { data: checkin, error } = await supabase
    .from("checkins")
    .insert({
      organization_id: organizationContext.activeOrganization.id,
      qr_item_id: qrItem.id,
      checkin_value: qrItem.qr_value,
      attendee_name: attendeeName,
      notes,
      checked_in_by: user.id,
    })
    .select("id")
    .single();

  if (error || !checkin) {
    throw new Error(error?.message ?? "Check-in could not be registered.");
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: "checkin_created",
    title: "Check-in registered",
    description: attendeeName ? `${attendeeName} checked in.` : "A check-in was registered.",
    actorId: user.id,
    metadata: { checkinId: checkin.id, qrItemId: qrItem.id, source: "manual" },
  });

  revalidatePath("/dashboard/modules/qr-checkins");
  revalidatePath("/dashboard");
}

export async function scanCheckinAction(
  _state: ScannerActionState,
  formData: FormData,
): Promise<ScannerActionState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const qrValue = String(formData.get("qrValue") || "").trim();

  if (!qrValue) {
    return { status: "error", message: "No QR value was detected." };
  }

  const { data: qrItem, error: qrItemError } = await supabase
    .from("qr_items")
    .select("id, name, qr_value, is_active")
    .eq("qr_value", qrValue)
    .eq("organization_id", organizationContext.activeOrganization.id)
    .single();

  if (qrItemError || !qrItem) {
    return { status: "error", message: "This QR code does not belong to the active organization." };
  }

  if (!qrItem.is_active) {
    return { status: "error", message: "This QR item is inactive." };
  }

  const { data: checkin, error } = await supabase
    .from("checkins")
    .insert({
      organization_id: organizationContext.activeOrganization.id,
      qr_item_id: qrItem.id,
      checkin_value: qrItem.qr_value,
      notes: "Camera scan",
      checked_in_by: user.id,
    })
    .select("id")
    .single();

  if (error || !checkin) {
    return { status: "error", message: error?.message ?? "Check-in could not be registered." };
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: "checkin_created",
    title: "QR check-in scanned",
    description: `${qrItem.name} was scanned from the camera scanner.`,
    actorId: user.id,
    metadata: { checkinId: checkin.id, qrItemId: qrItem.id, source: "scanner" },
  });

  revalidatePath("/dashboard/modules/qr-checkins");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Check-in registered.",
    itemName: qrItem.name,
  };
}

function createQrValue(organizationId: string) {
  return `hofadmin:qr:${organizationId}:${crypto.randomUUID()}`;
}
