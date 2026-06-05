import { FileText, Folder, Search, Upload } from "lucide-react";
import { uploadDocumentAction } from "@/app/dashboard/documents/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function DocumentsPage({ searchParams }: { searchParams?: Promise<{ q?: string; folder?: string; uploaded?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").trim();
  const folder = String(params.folder ?? "").trim();
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;

  let query = supabase
    .from("documents")
    .select("id, title, description, folder, file_path, file_name, file_type, record_scope, created_at, members(name), inventory_items(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,file_name.ilike.%${q}%`);
  if (folder) query = query.eq("folder", folder);

  const [{ data: documents }, { data: members }, { data: inventoryItems }] = await Promise.all([
    query,
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
    supabase.from("inventory_items").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
  ]);

  const signedUrls = new Map<string, string>();
  await Promise.all((documents ?? []).map(async (document) => {
    const { data } = await supabase.storage.from("organization-files").createSignedUrl(document.file_path, 600);
    if (data?.signedUrl) signedUrls.set(document.id, data.signedUrl);
  }));

  return (
    <>
      <PageHeader title="Document Archive" description="Store organization documents and connect them to members or inventory items." />
      <Toast show={params.uploaded === "1"} title="Document uploaded" message="The document was added to the archive." />
      <Toast show={Boolean(params.error)} tone="error" title="Document not uploaded" message="Check the file and document details, then try again." />

      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
            <CardDescription>Keep files organized in simple folders.</CardDescription>
          </CardHeader>
          <form action={uploadDocumentAction} encType="multipart/form-data" className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Title</span><Input name="title" required placeholder="Board meeting minutes" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Folder</span><Input name="folder" placeholder="General" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Description</span><Input name="description" placeholder="Optional short description" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Connect to member</span><select name="relatedMemberId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">No member</option>{(members ?? []).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Connect to inventory item</span><select name="relatedInventoryItemId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">No item</option>{(inventoryItems ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">File</span><input name="documentFile" type="file" required className="block w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:bg-zinc-950 dark:file:bg-zinc-900" /></label>
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"><Upload className="h-4 w-4" />Upload document</button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Search files by title, description, or file name.</CardDescription>
          </CardHeader>
          <form className="grid gap-3 p-5 pt-0 md:grid-cols-[1fr_12rem_auto]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={q} placeholder="Search documents" className="pl-9" /></div>
            <Input name="folder" defaultValue={folder} placeholder="Folder" />
            <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950" type="submit">Filter</button>
          </form>
          <div className="divide-y px-5 pb-5">
            {(documents ?? []).length ? documents?.map((document) => (
              <article key={document.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{document.title}</p><Badge>{document.folder}</Badge><Badge className="capitalize">{document.record_scope}</Badge></div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{document.description || document.file_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{[document.members?.name, document.inventory_items?.name].filter(Boolean).join(" - ") || "Organization document"}</p>
                </div>
                <ButtonLink href={signedUrls.get(document.id) ?? "#"} variant="secondary" className="h-9 px-3"><FileText className="h-4 w-4" />Open</ButtonLink>
              </article>
            )) : (
              <div className="rounded-xl border border-dashed p-8 text-center"><Folder className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No documents yet</p><p className="mt-1 text-sm text-muted-foreground">Upload your first document to start the archive.</p></div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
