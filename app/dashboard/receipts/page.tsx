import { Receipt, Search, Upload } from "lucide-react";
import { uploadReceiptAction } from "@/app/dashboard/receipts/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function ReceiptsPage({ searchParams }: { searchParams?: Promise<{ q?: string; category?: string; uploaded?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").trim();
  const category = String(params.category ?? "").trim();
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;

  let query = supabase
    .from("receipts")
    .select("id, vendor, amount, receipt_date, category, notes, file_path, file_name, created_at")
    .eq("organization_id", organizationId)
    .order("receipt_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) query = query.or(`vendor.ilike.%${q}%,notes.ilike.%${q}%,file_name.ilike.%${q}%`);
  if (category) query = query.eq("category", category);

  const { data: receipts } = await query;
  const signedUrls = new Map<string, string>();
  await Promise.all((receipts ?? []).map(async (receipt) => {
    const { data } = await supabase.storage.from("organization-files").createSignedUrl(receipt.file_path, 600);
    if (data?.signedUrl) signedUrls.set(receipt.id, data.signedUrl);
  }));

  return (
    <>
      <PageHeader title="Receipts" description="Upload and find digital receipts without adding accounting complexity." />
      <Toast show={params.uploaded === "1"} title="Receipt uploaded" message="The receipt was saved." />
      <Toast show={Boolean(params.error)} tone="error" title="Receipt not uploaded" message="Check the file and receipt details, then try again." />

      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload receipt</CardTitle>
            <CardDescription>Use a file upload or take a photo on mobile.</CardDescription>
          </CardHeader>
          <form action={uploadReceiptAction} encType="multipart/form-data" className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Vendor</span><Input name="vendor" required placeholder="Store or supplier" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Amount</span><Input name="amount" type="number" step="0.01" placeholder="0.00" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Date</span><Input name="receiptDate" type="date" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Category</span><Input name="category" placeholder="Equipment, travel, food" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Notes</span><Input name="notes" placeholder="Optional note" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Receipt file or photo</span><input name="receiptFile" type="file" accept="image/*,.pdf" capture="environment" required className="block w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:bg-zinc-950 dark:file:bg-zinc-900" /></label>
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"><Upload className="h-4 w-4" />Upload receipt</button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receipt records</CardTitle>
            <CardDescription>Search by vendor, note, or file name.</CardDescription>
          </CardHeader>
          <form className="grid gap-3 p-5 pt-0 md:grid-cols-[1fr_12rem_auto]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={q} placeholder="Search receipts" className="pl-9" /></div>
            <Input name="category" defaultValue={category} placeholder="Category" />
            <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950" type="submit">Filter</button>
          </form>
          <div className="divide-y px-5 pb-5">
            {(receipts ?? []).length ? receipts?.map((receipt) => (
              <article key={receipt.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{receipt.vendor}</p>{receipt.category ? <Badge>{receipt.category}</Badge> : null}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{receipt.amount != null ? `${receipt.amount}` : "No amount"} - {receipt.receipt_date ?? "No date"}</p>
                  {receipt.notes ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{receipt.notes}</p> : null}
                </div>
                <ButtonLink href={signedUrls.get(receipt.id) ?? "#"} variant="secondary" className="h-9 px-3"><Receipt className="h-4 w-4" />Open</ButtonLink>
              </article>
            )) : (
              <div className="rounded-xl border border-dashed p-8 text-center"><Receipt className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No receipts yet</p><p className="mt-1 text-sm text-muted-foreground">Upload receipts here. OCR can be added later.</p></div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
