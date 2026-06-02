"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { InventoryEventType, InventoryItemCondition, InventoryItemStatus } from "@/types/database";

const statuses = new Set<InventoryItemStatus>(["available", "in_use", "maintenance", "lost", "retired"]);
const conditions = new Set<InventoryItemCondition>(["new", "good", "fair", "poor", "broken"]);
const defaultLoanAgreementText =
  "I confirm that I have received this item and that I am responsible for returning it in the same condition by the agreed return date.";
const agreementBucket = "inventory-agreements";
const allowedAgreementTypes = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
]);

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
  const { supabase, organizationContext, user } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = String(formData.get("name") || "").trim();
  const description = clean(formData.get("description"));
  const color = /^#[0-9A-Fa-f]{6}$/.test(String(formData.get("color") || "")) ? String(formData.get("color")) : "#2563eb";
  const agreementEnabled = formData.get("agreementEnabled") === "on";
  const agreementTitle = clean(formData.get("agreementTitle"));
  const agreementText = clean(formData.get("agreementText"));
  const requireAcceptance = formData.get("requireAcceptanceBeforeSignature") === "on";

  if (name.length < 2 || name.length > 80) {
    redirect("/dashboard/inventory/categories?error=invalid");
  }

  const { data: category, error } = await supabase.from("inventory_categories").insert({
    organization_id: organizationId,
    name,
    description,
    color,
    agreement_enabled: agreementEnabled,
    agreement_title: agreementTitle,
    agreement_text: agreementText,
    require_acceptance_before_signature: requireAcceptance,
  }).select("id, name").single();

  if (error || !category) {
    redirect("/dashboard/inventory/categories?error=create");
  }

  const upload = await uploadCategoryAgreementDocument({ supabase, organizationId, categoryId: category.id, file: formData.get("agreementDocument") });
  if (upload.error) {
    redirect("/dashboard/inventory/categories?error=upload");
  }

  if (upload.metadata) {
    await supabase
      .from("inventory_categories")
      .update({
        agreement_file_path: upload.metadata.path,
        agreement_file_name: upload.metadata.name,
        agreement_file_type: upload.metadata.type,
        agreement_uploaded_at: new Date().toISOString(),
        agreement_uploaded_by: user.id,
      })
      .eq("id", category.id)
      .eq("organization_id", organizationId);
  }

  if (agreementEnabled || upload.metadata) {
    await recordInventoryCategoryEvent({
      supabase,
      organizationId,
      categoryId: category.id,
      eventType: "agreement_added",
      note: `${category.name} loan agreement was added.`,
      userId: user.id,
    });
  }

  revalidateInventory();
  redirect("/dashboard/inventory/categories?created=1");
}

export async function updateInventoryCategoryAction(formData: FormData) {
  const { supabase, organizationContext, user } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const categoryId = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = clean(formData.get("description"));
  const color = /^#[0-9A-Fa-f]{6}$/.test(String(formData.get("color") || "")) ? String(formData.get("color")) : "#2563eb";
  const agreementEnabled = formData.get("agreementEnabled") === "on";
  const agreementTitle = clean(formData.get("agreementTitle"));
  const agreementText = clean(formData.get("agreementText"));
  const requireAcceptance = formData.get("requireAcceptanceBeforeSignature") === "on";

  if (!categoryId || name.length < 2 || name.length > 80) {
    redirect("/dashboard/inventory/categories?error=invalid");
  }

  const { data: existing } = await supabase
    .from("inventory_categories")
    .select("id, name, agreement_enabled, agreement_title, agreement_text, agreement_file_path")
    .eq("id", categoryId)
    .eq("organization_id", organizationId)
    .single();

  if (!existing) {
    redirect("/dashboard/inventory/categories?error=not-found");
  }

  const upload = await uploadCategoryAgreementDocument({ supabase, organizationId, categoryId, file: formData.get("agreementDocument") });
  if (upload.error) {
    redirect("/dashboard/inventory/categories?error=upload");
  }

  const { error } = await supabase
    .from("inventory_categories")
    .update({
      name,
      description,
      color,
      agreement_enabled: agreementEnabled,
      agreement_title: agreementTitle,
      agreement_text: agreementText,
      require_acceptance_before_signature: requireAcceptance,
      ...(upload.metadata
        ? {
            agreement_file_path: upload.metadata.path,
            agreement_file_name: upload.metadata.name,
            agreement_file_type: upload.metadata.type,
            agreement_uploaded_at: new Date().toISOString(),
            agreement_uploaded_by: user.id,
          }
        : {}),
    })
    .eq("id", categoryId)
    .eq("organization_id", organizationId);

  if (error) {
    redirect("/dashboard/inventory/categories?error=update");
  }

  const agreementChanged =
    existing.agreement_enabled !== agreementEnabled ||
    existing.agreement_title !== agreementTitle ||
    existing.agreement_text !== agreementText ||
    Boolean(upload.metadata);

  if (agreementChanged) {
    await recordInventoryCategoryEvent({
      supabase,
      organizationId,
      categoryId,
      eventType: existing.agreement_enabled || existing.agreement_file_path ? "agreement_updated" : "agreement_added",
      note: `${name} loan agreement was ${existing.agreement_enabled || existing.agreement_file_path ? "updated" : "added"}.`,
      userId: user.id,
    });
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

  if (existing.assigned_to_member_id && !assignedToMemberId) {
    await markActiveLoanReturned({ supabase, organizationId, itemId, returnedAt: now });
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

export async function returnInventoryItemAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const itemId = String(formData.get("itemId") || "").trim();
  const now = new Date().toISOString();

  if (!itemId) {
    redirect("/dashboard/inventory/items?error=invalid");
  }

  const { data: item } = await supabase
    .from("inventory_items")
    .select("id, name, condition, location, notes, assigned_to_member_id")
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .single();

  if (!item) {
    redirect("/dashboard/inventory/items?error=not-found");
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({
      status: "available",
      assigned_to_member_id: null,
      loan_due_date: null,
      loan_note: null,
      last_returned_at: now,
      updated_at: now,
    })
    .eq("id", itemId)
    .eq("organization_id", organizationId);

  if (error) {
    redirect(`/dashboard/inventory/items/${itemId}?error=return`);
  }

  await markActiveLoanReturned({ supabase, organizationId, itemId, returnedAt: now });
  await recordInventoryEvent({
    supabase,
    organizationId,
    itemId,
    eventType: "returned",
    note: `${item.name} was returned and is available.`,
    userId: user.id,
  });

  revalidateInventory();
  revalidatePath(`/dashboard/inventory/items/${itemId}`);
  revalidatePath("/dashboard/inventory/loans");
  redirect(`/dashboard/inventory/items/${itemId}?returned=1`);
}

export async function completeInventoryLoanAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const itemId = String(formData.get("itemId") || "").trim();
  const memberId = String(formData.get("memberId") || "").trim();
  const dueDate = clean(formData.get("dueDate"));
  const loanNote = clean(formData.get("loanNote"));
  const agreementText = String(formData.get("agreementText") || defaultLoanAgreementText).trim();
  const agreementAccepted = formData.get("agreementAccepted") === "on";
  const signatureDataUrl = String(formData.get("signatureDataUrl") || "").trim();
  const now = new Date().toISOString();

  if (!itemId || !memberId || !signatureDataUrl.startsWith("data:image/png;base64,")) {
    redirect(`/dashboard/inventory/items/${itemId || ""}?error=loan`);
  }

  const [{ data: item }, { data: member }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, category_id, inventory_categories(id, agreement_enabled, agreement_title, agreement_text, agreement_file_path, agreement_file_name, require_acceptance_before_signature)")
      .eq("id", itemId)
      .eq("organization_id", organizationId)
      .single(),
    supabase
      .from("members")
      .select("id, name, email, phone")
      .eq("id", memberId)
      .eq("organization_id", organizationId)
      .single(),
  ]);

  if (!item || !member) {
    redirect(`/dashboard/inventory/items/${itemId}?error=loan`);
  }

  const categoryAgreement = normalizeCategoryAgreement(item.inventory_categories);
  const usesCategoryAgreement = Boolean(categoryAgreement?.agreement_enabled);
  const agreementSnapshotText = usesCategoryAgreement ? categoryAgreement?.agreement_text?.trim() ?? "" : agreementText;
  const agreementSnapshotFilePath = usesCategoryAgreement ? categoryAgreement?.agreement_file_path ?? null : clean(formData.get("agreementFilePath"));
  const agreementSnapshotFileName = usesCategoryAgreement ? categoryAgreement?.agreement_file_name ?? null : clean(formData.get("agreementFileName"));
  const hasAgreementBody = agreementSnapshotText.length >= 20 || Boolean(agreementSnapshotFilePath);
  const requireAcceptance = usesCategoryAgreement && categoryAgreement?.require_acceptance_before_signature !== false;

  if (!hasAgreementBody || (requireAcceptance && !agreementAccepted)) {
    redirect(`/dashboard/inventory/items/${itemId}?error=agreement`);
  }

  await markActiveLoanReturned({ supabase, organizationId, itemId, returnedAt: now, status: "cancelled" });

  const { data: loan, error: loanError } = await supabase
    .from("inventory_loans")
    .insert({
      organization_id: organizationId,
      inventory_item_id: itemId,
      member_id: memberId,
      loaned_by: user.id,
      loaned_at: now,
      due_date: dueDate,
      status: "active",
      loan_note: loanNote,
      agreement_text: agreementSnapshotText || "See uploaded agreement document.",
      agreement_category_id: usesCategoryAgreement ? categoryAgreement?.id ?? item.category_id : null,
      agreement_title_snapshot: usesCategoryAgreement ? categoryAgreement?.agreement_title ?? "Loan Agreement" : clean(formData.get("agreementTitle")),
      agreement_text_snapshot: agreementSnapshotText || null,
      agreement_file_path_snapshot: agreementSnapshotFilePath,
      agreement_file_name_snapshot: agreementSnapshotFileName,
      agreement_accepted_at: usesCategoryAgreement ? now : null,
      agreement_accepted_by: usesCategoryAgreement ? memberId : null,
      borrower_name: member.name,
      borrower_email: member.email,
      borrower_phone: member.phone,
      signature_data_url: signatureDataUrl,
      signed_at: now,
    })
    .select("id")
    .single();

  if (loanError || !loan) {
    redirect(`/dashboard/inventory/items/${itemId}?error=loan`);
  }

  const { error: itemError } = await supabase
    .from("inventory_items")
    .update({
      status: "in_use",
      assigned_to_member_id: memberId,
      loan_due_date: dueDate,
      loan_note: loanNote,
      last_assigned_at: now,
      updated_at: now,
    })
    .eq("id", itemId)
    .eq("organization_id", organizationId);

  if (itemError) {
    redirect(`/dashboard/inventory/items/${itemId}?error=loan`);
  }

  if (usesCategoryAgreement) {
    await recordInventoryEvent({
      supabase,
      organizationId,
      itemId,
      eventType: "agreement_accepted",
      note: `${member.name} accepted ${categoryAgreement?.agreement_title ?? "the loan agreement"} for ${item.name}.`,
      userId: user.id,
    });
  }

  await recordInventoryEvent({
    supabase,
    organizationId,
    itemId,
    eventType: "assigned",
    note: `${item.name} loaned to ${member.name}${dueDate ? ` until ${dueDate}` : ""}${usesCategoryAgreement ? " with agreement accepted" : ""}.`,
    userId: user.id,
  });

  revalidateInventory();
  redirect(`/dashboard/inventory/items/${itemId}?loaned=1`);
}

function normalizeCategoryAgreement(
  category:
    | {
        id: string;
        agreement_enabled: boolean | null;
        agreement_title: string | null;
        agreement_text: string | null;
        agreement_file_path: string | null;
        agreement_file_name: string | null;
        require_acceptance_before_signature: boolean | null;
      }
    | {
        id: string;
        agreement_enabled: boolean | null;
        agreement_title: string | null;
        agreement_text: string | null;
        agreement_file_path: string | null;
        agreement_file_name: string | null;
        require_acceptance_before_signature: boolean | null;
      }[]
    | null,
) {
  return Array.isArray(category) ? category[0] ?? null : category;
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

async function recordInventoryCategoryEvent({
  supabase,
  organizationId,
  categoryId,
  eventType,
  note,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  categoryId: string;
  eventType: InventoryEventType;
  note: string | null;
  userId: string;
}) {
  await supabase.from("inventory_events").insert({
    organization_id: organizationId,
    inventory_category_id: categoryId,
    event_type: eventType,
    note,
    created_by: userId,
  });
}

async function uploadCategoryAgreementDocument({
  supabase,
  organizationId,
  categoryId,
  file,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  categoryId: string;
  file: FormDataEntryValue | null;
}): Promise<{ metadata?: { path: string; name: string; type: string }; error?: string }> {
  if (!(file instanceof File) || !file.name || file.size === 0) {
    return {};
  }

  const extension = allowedAgreementTypes.get(file.type);
  const fallbackExtension = file.name.split(".").pop()?.toLowerCase();
  const supportedExtension = extension ?? (fallbackExtension && ["pdf", "doc", "docx"].includes(fallbackExtension) ? fallbackExtension : null);

  if (!supportedExtension) {
    return { error: "unsupported-file" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: "file-too-large" };
  }

  const safeName = sanitizeFileName(file.name, supportedExtension);
  const path = `organizations/${organizationId}/inventory/category-agreements/${categoryId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(agreementBucket).upload(path, file, {
    contentType: file.type || contentTypeForExtension(supportedExtension),
    upsert: true,
  });

  if (error) {
    return { error: error.message };
  }

  return { metadata: { path, name: file.name, type: file.type || contentTypeForExtension(supportedExtension) } };
}

function sanitizeFileName(fileName: string, extension: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const safeBase = withoutExtension.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "agreement";
  return `${safeBase}.${extension}`;
}

function contentTypeForExtension(extension: string) {
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function revalidateInventory() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/inventory/items");
  revalidatePath("/dashboard/inventory/create");
  revalidatePath("/dashboard/inventory/categories");
  revalidatePath("/dashboard/inventory/activity");
  revalidatePath("/dashboard/inventory/loans");
}

async function markActiveLoanReturned({
  supabase,
  organizationId,
  itemId,
  returnedAt,
  status = "returned",
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  itemId: string;
  returnedAt: string;
  status?: "returned" | "cancelled";
}) {
  await supabase
    .from("inventory_loans")
    .update({ status, returned_at: returnedAt, updated_at: returnedAt })
    .eq("organization_id", organizationId)
    .eq("inventory_item_id", itemId)
    .eq("status", "active");
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
