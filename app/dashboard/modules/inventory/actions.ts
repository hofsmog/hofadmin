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

export type InventoryScanState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  itemName?: string;
  itemHref?: string;
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
  const loanDueDate = clean(formData.get("loanDueDate"));
  const loanNote = clean(formData.get("loanNote"));
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
      loan_due_date: assignedToMemberId ? loanDueDate : null,
      loan_note: assignedToMemberId ? loanNote : null,
      last_assigned_at: assignedToMemberId ? new Date().toISOString() : null,
      qr_value: clean(formData.get("qrValue")),
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

  if (shouldGenerateQr) {
    await supabase
      .from("inventory_items")
      .update({ qr_value: buildInventoryQrValue(item.id), updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("organization_id", organizationId);
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

export async function resolveInventoryQrAction(
  _state: InventoryScanState,
  formData: FormData,
): Promise<InventoryScanState> {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const qrValue = String(formData.get("qrValue") || "").trim();
  const itemId = parseInventoryQrItemId(qrValue);

  if (!qrValue) {
    return { status: "error", message: "Scan or enter an inventory QR value." };
  }

  const { data: qrItem, error: qrError } = await supabase
    .from("inventory_items")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("qr_value", qrValue)
    .maybeSingle();

  if (qrError) {
    return { status: "error", message: "No inventory item found for this QR code." };
  }

  const { data: item, error } = qrItem || !itemId
    ? { data: qrItem, error: null }
    : await supabase
        .from("inventory_items")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("id", itemId)
        .maybeSingle();

  if (error || !item) {
    return { status: "error", message: "No inventory item found for this QR code." };
  }

  return {
    status: "success",
    message: "Inventory item found. Opening item details...",
    itemName: item.name,
    itemHref: `/dashboard/inventory/items/${item.id}`,
  };
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
  const loanDueDate = clean(formData.get("loanDueDate"));
  const loanNote = clean(formData.get("loanNote"));
  const notes = clean(formData.get("notes"));
  const savedStatus = assignedToMemberId && status === "available" ? "in_use" : status;
  const now = new Date().toISOString();

  if (!itemId || !statuses.has(status) || !conditions.has(condition)) {
    redirect("/dashboard/inventory/items?error=invalid");
  }

  const { data: existing } = await supabase
    .from("inventory_items")
    .select("id, status, location, assigned_to_member_id, loan_due_date")
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
      loan_due_date: assignedToMemberId ? loanDueDate : null,
      loan_note: assignedToMemberId ? loanNote : null,
      last_assigned_at: !existing.assigned_to_member_id && assignedToMemberId ? now : undefined,
      last_returned_at: existing.assigned_to_member_id && !assignedToMemberId ? now : undefined,
      notes,
      updated_at: now,
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
          : existing.loan_due_date !== loanDueDate
            ? "due_date_changed"
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
    note: clean(formData.get("eventNote")) ?? buildInventoryEventNote(eventType, loanDueDate),
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

function buildInventoryEventNote(eventType: InventoryEventType, dueDate: string | null) {
  if (eventType === "returned") {
    return `Item returned at ${new Date().toLocaleString()}.`;
  }

  if (eventType === "assigned" && dueDate) {
    return `Item assigned. Due back ${dueDate}.`;
  }

  if (eventType === "due_date_changed") {
    return dueDate ? `Due date changed to ${dueDate}.` : "Due date cleared.";
  }

  return "Inventory item updated.";
}

function buildInventoryQrValue(itemId: string) {
  return `inventory:item:${itemId}`;
}

function parseInventoryQrItemId(qrValue: string) {
  const match = qrValue.match(/^inventory:item:([0-9a-fA-F-]{36})$/);
  return match?.[1] ?? null;
}
