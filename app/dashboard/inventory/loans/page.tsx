import Link from "next/link";
import { CalendarClock, ClipboardList } from "lucide-react";
import { InventoryReturnAction } from "@/components/dashboard/inventory/inventory-return-action";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryLoansPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const today = dateOnly(new Date()).toISOString().slice(0, 10);
  const filter = params.filter === "overdue" ? "overdue" : "active";
  let loansQuery = supabase
    .from("inventory_loans")
    .select("id, inventory_item_id, borrower_name, loaned_at, due_date, inventory_items(id, name, asset_tag)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(50);
  if (filter === "overdue") {
    loansQuery = loansQuery.lt("due_date", today);
  }
  const { data: loans } = await loansQuery;

  return (
    <>
      <ModuleHeader
        title="Active Loans"
        description={filter === "overdue" ? "Overdue borrowed items that need follow-up." : "See what is currently borrowed and return items quickly."}
        items={inventoryNavItems}
        action={{ href: "/dashboard/inventory/items", label: "View items" }}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{filter === "overdue" ? "Overdue loans" : "Currently borrowed"}</CardTitle>
              <CardDescription>{filter === "overdue" ? "Items past their due date." : "Active inventory loans sorted by due date."}</CardDescription>
            </div>
            <Badge>{loans?.length ?? 0} active</Badge>
          </div>
        </CardHeader>
        <div className="divide-y px-5 pb-5">
          {(loans ?? []).length ? loans?.map((loan) => {
            const dueState = getDueState(loan.due_date);
            const daysOverdue = getDaysOverdue(loan.due_date);

            return (
              <article key={loan.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem_10rem_9rem_auto] lg:items-center">
                <Link href={`/dashboard/inventory/items/${loan.inventory_item_id}`} className="min-w-0">
                  <p className="truncate text-sm font-semibold">{loan.inventory_items?.name ?? "Inventory item"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{loan.inventory_items?.asset_tag ?? "No asset tag"}</p>
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{loan.borrower_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Borrower</p>
                </div>
                <Meta label="Loan Date" value={new Date(loan.loaned_at).toLocaleDateString()} />
                <Meta label="Due Date" value={loan.due_date ?? "No due date"} />
                <DueBadge state={dueState} daysOverdue={daysOverdue} />
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <ButtonLink href={`/dashboard/inventory/loans/${loan.id}`} variant="ghost" className="h-9 px-3">Agreement</ButtonLink>
                  <InventoryReturnAction itemId={loan.inventory_item_id} className="h-9 px-3" />
                </div>
              </article>
            );
          }) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-medium">No active loans</p>
              <p className="mt-1 text-sm text-muted-foreground">Borrowed items will appear here until they are returned.</p>
              <ButtonLink href="/dashboard/inventory/items" className="mt-4">View items</ButtonLink>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm lg:block">
      <CalendarClock className="h-4 w-4 text-muted-foreground lg:hidden" />
      <p className="font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DueBadge({ state, daysOverdue }: { state: DueState; daysOverdue: number }) {
  if (state === "overdue") {
    return <Badge className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{daysOverdue} days overdue</Badge>;
  }
  if (state === "today") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Due Today</Badge>;
  }
  if (state === "soon") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Due Soon</Badge>;
  }

  return <Badge>On Loan</Badge>;
}

type DueState = "overdue" | "today" | "soon" | "active" | "none";

function getDueState(dueDate: string | null): DueState {
  if (!dueDate) return "none";
  const today = dateOnly(new Date());
  const due = new Date(`${dueDate}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "soon";
  return "active";
}

function getDaysOverdue(dueDate: string | null) {
  if (!dueDate) return 0;
  const today = dateOnly(new Date());
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.max(0, Math.ceil((today.getTime() - due.getTime()) / 86_400_000));
}

function dateOnly(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
