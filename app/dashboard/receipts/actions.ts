"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

const fileBucket = "organization-files";

export async function uploadReceiptAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const vendor = String(formData.get("vendor") || "").trim();
  const amount = clean(formData.get("amount"));
  const receiptDate = clean(formData.get("receiptDate"));
  const category = clean(formData.get("category"));
  const notes = clean(formData.get("notes"));
  const file = formData.get("receiptFile");

  if (vendor.length < 2 || !(file instanceof File) || !file.name || file.size === 0) {
    redirect("/dashboard/receipts?error=invalid");
  }

  if (file.size > 20 * 1024 * 1024) {
    redirect("/dashboard/receipts?error=upload");
  }

  const safeName = sanitizeFileName(file.name);
  const path = `organizations/${organizationId}/receipts/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from(fileBucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });

  if (uploadError) {
    redirect("/dashboard/receipts?error=upload");
  }

  const { data: receipt, error } = await supabase.from("receipts").insert({
    organization_id: organizationId,
    vendor,
    amount: amount ? Number(amount) : null,
    receipt_date: receiptDate,
    category,
    notes,
    file_path: path,
    file_name: file.name,
    file_type: file.type || null,
    uploaded_by: user.id,
  }).select("id, vendor").single();

  if (error || !receipt) {
    redirect("/dashboard/receipts?error=create");
  }

  await recordActivityEvent({
    supabase,
    organizationId,
    type: "receipt_uploaded",
    title: "Receipt uploaded",
    description: `${receipt.vendor} receipt was added.`,
    actorId: user.id,
    metadata: { receiptId: receipt.id, category },
  });

  revalidatePath("/dashboard/receipts");
  redirect("/dashboard/receipts?uploaded=1");
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : "";
  const base = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "receipt";
  return `${base}${extension}`;
}
