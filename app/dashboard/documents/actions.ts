"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

const fileBucket = "organization-files";

export async function uploadDocumentAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = String(formData.get("title") || "").trim();
  const description = clean(formData.get("description"));
  const folder = String(formData.get("folder") || "General").trim() || "General";
  const relatedMemberId = clean(formData.get("relatedMemberId"));
  const relatedInventoryItemId = clean(formData.get("relatedInventoryItemId"));
  const file = formData.get("documentFile");

  if (title.length < 2 || !(file instanceof File) || !file.name || file.size === 0) {
    redirect("/dashboard/documents?error=invalid");
  }

  const uploaded = await uploadOrganizationFile({
    supabase,
    organizationId,
    area: "documents",
    file,
  });

  if (!uploaded) {
    redirect("/dashboard/documents?error=upload");
  }

  const scope = relatedMemberId ? "member" : relatedInventoryItemId ? "inventory" : "organization";
  const { data: document, error } = await supabase.from("documents").insert({
    organization_id: organizationId,
    title,
    description,
    folder,
    file_path: uploaded.path,
    file_name: file.name,
    file_type: file.type || null,
    related_member_id: relatedMemberId,
    related_inventory_item_id: relatedInventoryItemId,
    record_scope: scope,
    uploaded_by: user.id,
  }).select("id, title").single();

  if (error || !document) {
    redirect("/dashboard/documents?error=create");
  }

  await recordActivityEvent({
    supabase,
    organizationId,
    type: "document_uploaded",
    title: "Document uploaded",
    description: `${document.title} was added to the document archive.`,
    actorId: user.id,
    metadata: { documentId: document.id, scope },
  });

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents?uploaded=1");
}

async function uploadOrganizationFile({
  supabase,
  organizationId,
  area,
  file,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  area: string;
  file: File;
}) {
  if (file.size > 20 * 1024 * 1024) {
    return null;
  }

  const safeName = sanitizeFileName(file.name);
  const path = `organizations/${organizationId}/${area}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(fileBucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return null;
  }

  return { path };
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : "";
  const base = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "file";
  return `${base}${extension}`;
}
