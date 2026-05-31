import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, FileSignature, UserRound } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;

  const { data: loan } = await supabase
    .from("inventory_loans")
    .select("id, inventory_item_id, member_id, loaned_at, due_date, returned_at, status, loan_note, agreement_text, borrower_name, borrower_email, borrower_phone, signature_data_url, signed_at, inventory_items(name, asset_tag)")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!loan) notFound();

  return (
    <>
      <ModuleHeader title="Loan agreement" description="Signed inventory loan record." items={inventoryNavItems} />
      <div className="mb-4">
        <ButtonLink href={`/dashboard/inventory/items/${loan.inventory_item_id}`} variant="ghost" className="h-9 px-2">
          <ArrowLeft className="h-4 w-4" />
          Back to item
        </ButtonLink>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{loan.inventory_items?.name ?? "Inventory item"}</CardTitle>
                <CardDescription>{loan.inventory_items?.asset_tag ?? "No asset tag"}</CardDescription>
              </div>
              <Badge className="capitalize">{loan.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Info icon={UserRound} label="Borrower" value={loan.borrower_name} />
            <Info icon={Calendar} label="Loaned" value={new Date(loan.loaned_at).toLocaleString()} />
            <Info icon={Calendar} label="Due date" value={loan.due_date ?? "No due date"} />
            <Info icon={Calendar} label="Returned" value={loan.returned_at ? new Date(loan.returned_at).toLocaleString() : "Not returned"} />
            {loan.loan_note ? (
              <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <p className="text-xs font-medium uppercase text-muted-foreground">Loan note</p>
                <p className="mt-2 text-sm leading-6">{loan.loan_note}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature</CardTitle>
            <CardDescription>Signed {new Date(loan.signed_at).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={loan.signature_data_url} alt={`${loan.borrower_name} signature`} className="w-full rounded-xl border bg-white p-3" />
            <div className="mt-4 rounded-xl border bg-zinc-50 p-3 text-sm text-muted-foreground dark:bg-zinc-900/60">
              {[loan.borrower_email, loan.borrower_phone].filter(Boolean).join(" - ") || "No contact details captured"}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agreement text</CardTitle>
            <CardDescription>The exact agreement saved at signing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-zinc-50 p-5 text-sm leading-7 dark:bg-zinc-900/60">
              <FileSignature className="mb-3 h-5 w-5 text-muted-foreground" />
              {loan.agreement_text}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-zinc-700 dark:bg-zinc-950">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
