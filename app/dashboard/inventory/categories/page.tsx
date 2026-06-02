import { FileText, FolderPlus } from "lucide-react";
import { createInventoryCategoryAction, updateInventoryCategoryAction } from "@/app/dashboard/modules/inventory/actions";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryCategoriesPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("inventory_categories")
      .select("id, name, description, color, agreement_enabled, agreement_title, agreement_text, agreement_file_path, agreement_file_name, agreement_file_type, agreement_uploaded_at, require_acceptance_before_signature")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase.from("inventory_items").select("id, category_id").eq("organization_id", organizationId),
  ]);
  const itemCounts = new Map<string, number>();
  for (const item of items ?? []) {
    if (item.category_id) itemCounts.set(item.category_id, (itemCounts.get(item.category_id) ?? 0) + 1);
  }
  const signedUrls = new Map<string, string>();
  await Promise.all((categories ?? []).map(async (category) => {
    if (!category.agreement_file_path) return;
    const { data } = await supabase.storage.from("inventory-agreements").createSignedUrl(category.agreement_file_path, 60 * 10);
    if (data?.signedUrl) signedUrls.set(category.id, data.signedUrl);
  }));

  return (
    <>
      <ModuleHeader title="Inventory Categories" description="Group items and define default loan agreements per category." items={inventoryNavItems} />
      <Toast show={params.created === "1"} title="Category created" message="Inventory category is ready to use." />
      <Toast show={params.updated === "1"} title="Category updated" message="Inventory category details were saved." />
      <Toast show={Boolean(params.error)} tone="error" title="Category not saved" message={params.error === "upload" ? "Only PDF, DOC, or DOCX files up to 10 MB are supported." : "Check the category details and try again."} />
      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create category</CardTitle>
            <CardDescription>Add agreement settings now, or leave them off and add them later.</CardDescription>
          </CardHeader>
          <form action={createInventoryCategoryAction} encType="multipart/form-data" className="space-y-5 p-5 pt-0">
            <CategoryBasics />
            <AgreementFields />
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"><FolderPlus className="h-4 w-4" />Create category</button>
          </form>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Inventory groups, item counts, and category loan agreements.</CardDescription>
          </CardHeader>
          <div className="space-y-3 p-5 pt-0">
            {(categories ?? []).length ? categories?.map((category) => (
              <article key={category.id} className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <h3 className="font-semibold">{category.name}</h3>
                      {category.agreement_enabled ? <Badge>Loan Agreement</Badge> : null}
                    </div>
                    {category.description ? <p className="mt-1 text-sm text-muted-foreground">{category.description}</p> : null}
                    {category.agreement_enabled ? (
                      <div className="mt-3 rounded-xl border bg-white p-3 text-sm dark:bg-zinc-950">
                        <p className="font-medium">{category.agreement_title || "Loan Agreement"}</p>
                        <p className="mt-1 line-clamp-2 text-muted-foreground">{category.agreement_text || "No agreement text added yet."}</p>
                        {category.agreement_file_name ? (
                          <a href={signedUrls.get(category.id) ?? "#"} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50">
                            <FileText className="h-4 w-4" />
                            {category.agreement_file_name}
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <Badge>{itemCounts.get(category.id) ?? 0} items</Badge>
                </div>
                <form action={updateInventoryCategoryAction} encType="multipart/form-data" className="mt-4 space-y-4 border-t pt-4">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_6rem]">
                    <Input name="name" defaultValue={category.name} aria-label="Category name" />
                    <Input name="description" defaultValue={category.description ?? ""} aria-label="Category description" />
                    <input type="color" name="color" defaultValue={category.color} aria-label="Category color" className="h-11 w-full rounded-xl border bg-white p-1 dark:bg-zinc-950" />
                  </div>
                  <AgreementFields
                    enabled={category.agreement_enabled}
                    title={category.agreement_title}
                    text={category.agreement_text}
                    requireAcceptance={category.require_acceptance_before_signature}
                    fileName={category.agreement_file_name}
                    fileUrl={signedUrls.get(category.id)}
                  />
                  <button type="submit" className="h-11 rounded-xl border bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                    Save category
                  </button>
                </form>
              </article>
            )) : <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">No categories yet</p><p className="mt-1 text-sm text-muted-foreground">Create a category to organize inventory items.</p></div>}
          </div>
        </Card>
      </div>
    </>
  );
}

function CategoryBasics() {
  return (
    <div className="space-y-4">
      <label className="block space-y-2"><span className="text-sm font-medium">Name</span><Input name="name" required placeholder="Laptops" /></label>
      <label className="block space-y-2"><span className="text-sm font-medium">Description</span><Input name="description" placeholder="Student and staff laptops" /></label>
      <label className="block space-y-2"><span className="text-sm font-medium">Color</span><div className="flex gap-2"><input type="color" name="color" defaultValue="#2563eb" className="h-11 w-12 rounded-xl border bg-white p-1" /><Input name="colorText" defaultValue="#2563eb" disabled /></div></label>
    </div>
  );
}

function AgreementFields({
  enabled = false,
  title = "",
  text = "",
  requireAcceptance = true,
  fileName,
  fileUrl,
}: {
  enabled?: boolean;
  title?: string | null;
  text?: string | null;
  requireAcceptance?: boolean;
  fileName?: string | null;
  fileUrl?: string;
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-white p-4 dark:bg-zinc-950">
      <div>
        <h4 className="text-sm font-semibold">Loan Agreement</h4>
        <p className="mt-1 text-sm text-muted-foreground">Use this agreement automatically when items in this category are borrowed.</p>
      </div>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="agreementEnabled" defaultChecked={enabled} className="mt-1 h-4 w-4 rounded border-zinc-300" />
        <span>
          <span className="block text-sm font-medium">Enable agreement for this category</span>
          <span className="mt-1 block text-sm text-muted-foreground">Borrowers must review this agreement before signing.</span>
        </span>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Agreement Title</span>
        <Input name="agreementTitle" defaultValue={title ?? ""} placeholder="Laptop Loan Agreement" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Agreement Text</span>
        <textarea name="agreementText" defaultValue={text ?? ""} rows={5} placeholder="Write the agreement borrowers should accept..." className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Upload Agreement Document</span>
        <input name="agreementDocument" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:bg-zinc-950 dark:file:bg-zinc-900" />
        <span className="block text-xs text-muted-foreground">PDF, DOC, or DOCX. Uploads are private to your organization.</span>
        {fileName ? (
          <a href={fileUrl ?? "#"} className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
            <FileText className="h-4 w-4" />
            Current file: {fileName}
          </a>
        ) : null}
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="requireAcceptanceBeforeSignature" defaultChecked={requireAcceptance} className="mt-1 h-4 w-4 rounded border-zinc-300" />
        <span>
          <span className="block text-sm font-medium">Require acceptance before signing</span>
          <span className="mt-1 block text-sm text-muted-foreground">The borrower cannot continue to signature until the agreement is accepted.</span>
        </span>
      </label>
    </section>
  );
}
