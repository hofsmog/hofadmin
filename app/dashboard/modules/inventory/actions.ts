"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { InventoryEventType, InventoryItemCondition, InventoryItemStatus } from "@/types/database";

const statuses = new Set<InventoryItemStatus>(["available", "in_use", "maintenance", "lost", "retired"]);
const conditions = new Set<InventoryItemCondition>(["new", "good", "fair", "poor", "broken"]);

export type InventoryFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function createInventoryItemAction(
  _state: InventoryFormState,
  formData: FormData,
): Promise<InventoryFormState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = String(formData.get("name") || "").trim();
  const description = clean(formData.get("description"));
  const categoryId = clean(formData.get("categoryId"));
  const assetTag = clean(formData.get("assetTag"));
  const serialNumber = clean(formData.get("serialNumber"));
  const status = String(formData.get("status") || "available") as InventoryItemStatus;
  const condition = String(formData.get("condition") || "good") as InventoryItemCondition;
  const location = clean(formData.get("location"));
  const assignedToMemberId = clean(formData.get("assignedToMemberId"));
  const purchaseDate = clean(formData.get("purchaseDate"));
  const purchasePrice = clean(formData.get("purchasePrice"));
  const notes = clean(formData.get("notes"));
  const shouldGenerateQr = formData.get("generateQr") === "on";
  const savedStatus = assignedToMemberId && status === "available" ? "in_use" : status;

  if (name.length < 2 || name.length > 140) {
    return { status: "error", message: "Item name must be between 2 and 140 characters." };
  }

  if (!statuses.has(status) || !conditions.has(condition)) {
    return { status: "error", message: "Choose a valid inventory status and condition." };
  }

  const qrValue = shouldGenerateQr
    ? `hofadmin://inventory/${organizationId}/${crypto.randomUUID()}`
    : clean(formData.get("qrValue"));

  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({
      organization_id: organizationId,
      name,
      description,
      category_id: categoryId,
      asset_tag: assetTag,
      serial_number: serialNumber,
      status: savedStatus,
      condition,
      location,
      assigned_to_member_id: assignedToMemberId,
      qr_value: qrValue,
      purchase_date: purchaseDate,
      purchase_price: purchasePrice ? Number(purchasePrice) : null,
      notes,
      created_by: user.id,
    })
    .select("id, name")
    .single();

  if (error || !item) {
    return { status: "error", message: error?.message ?? "Inventory item could not be created." };
  }

  await recordInventoryEvent({
    supabase,
    organizationId,
    itemId: item.id,
    eventType: "created",
    note: `${item.name} was added to inventory.`,
    userId: user.id,
  });

  if (assignedToMemberId) {
    await recordInventoryEvent({
      supabase,
      organizationId,
      itemId: item.id,
      eventType: "assigned",
      note: `${item.name} was assigned when it was created.`,
      userId: user.id,
    });
  }

  revalidateInventory();
  return { status: "success", message: `${item.name} was added to inventory.` };
}

export async function createInventoryCategoryAction(formData: FormData) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = String(formData.get("name") || "").trim();
  const description = clean(formData.get("description"));
  const color = /^#[0-9A-Fa-f]{6}$/.test(String(formData.get("color") || "")) ? String(formData.get("color")) : "#2563eb";

  if (name.length < 2 || name.length > 80) {
    redirect("/dashboard/inventory/categories?error=invalid");
  }

  const { error } = await supabase.from("inventory_categories").insert({
    organization_id: organizationId,
    name,
    description,
    color,
  });

  if (error) {
    redirect("/dashboard/inventory/categories?error=create");
  }

  revalidateInventory();
  redirect("/dashboard/inventory/categories?created=1");
}

export async function updateInventoryCategoryAction(formData: FormData) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const categoryId = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = clean(formData.get("description"));
  const color = /^#[0-9A-Fa-f]{6}$/.test(String(formData.get("color") || "")) ? String(formData.get("color")) : "#2563eb";

  if (!categoryId || name.length < 2 || name.length > 80) {
    redirect("/dashboard/inventory/categories?error=invalid");
  }

  const { error } = await supabase
    .from("inventory_categories")
    .update({ name, description, color })
    .eq("id", categoryId)
    .eq("organization_id", organizationId);

  if (error) {
    redirect("/dashboard/inventory/categories?error=update");
  }

  revalidateInventory();
  redirect("/dashboard/inventory/categories?updated=1");
}

export async function updateInventoryItemStatusAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const itemId = String(formData.get("itemId") || "").trim();
  const status = String(formData.get("status") || "") as InventoryItemStatus;
  const condition = String(formData.get("condition") || "") as InventoryItemCondition;
  const location = clean(formData.get("location"));
  const assignedToMemberId = clean(formData.get("assignedToMemberId"));
  const notes = clean(formData.get("notes"));
  const savedStatus = assignedToMemberId && status === "available" ? "in_use" : status;

  if (!itemId || !statuses.has(status) || !conditions.has(condition)) {
    redirect("/dashboard/inventory/items?error=invalid");
  }

  const { data: existing } = await supabase
    .from("inventory_items")
    .select("id, status, location, assigned_to_member_id")
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .single();

  if (!existing) {
    redirect("/dashboard/inventory/items?error=not-found");
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({
      status: savedStatus,
      condition,
      location,
      assigned_to_member_id: assignedToMemberId,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("organization_id", organizationId);

  if (error) {
    redirect(`/dashboard/inventory/items/${itemId}?error=update`);
  }

  const eventType: InventoryEventType =
    savedStatus === "retired"
      ? "retired"
      : existing.assigned_to_member_id !== assignedToMemberId
        ? assignedToMemberId
          ? "assigned"
          : "returned"
        : existing.location !== location
          ? "location_changed"
          : existing.status !== savedStatus
            ? savedStatus === "maintenance"
              ? "maintenance"
              : "status_changed"
            : "updated";

  await recordInventoryEvent({
    supabase,
    organizationId,
    itemId,
    eventType,
    note: clean(formData.get("eventNote")) ?? "Inventory item updated.",
    userId: user.id,
  });

  revalidateInventory();
  redirect(`/dashboard/inventory/items/${itemId}?updated=1`);
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

async function recordInventoryEvent({
  supabase,
  organizationId,
  itemId,
  eventType,
  note,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  itemId: string;
  eventType: InventoryEventType;
  note: string | null;
  userId: string;
}) {
  await supabase.from("inventory_events").insert({
    organization_id: organizationId,
    inventory_item_id: itemId,
    event_type: eventType,
    note,
    created_by: userId,
  });
}

function revalidateInventory() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/inventory/items");
  revalidatePath("/dashboard/inventory/create");
  revalidatePath("/dashboard/inventory/categories");
  revalidatePath("/dashboard/inventory/activity");
}
