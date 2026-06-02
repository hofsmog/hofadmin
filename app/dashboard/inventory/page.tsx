import { AlertTriangle, Boxes, ClipboardList, PackageCheck, PackagePlus, ScanLine } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";

export default async function InventoryOverviewPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const today = dateOnly(new Date());
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 7);
  const [
    { count: totalItems },
    { count: availableItems },
    { count: activeLoans },
    { count: overdueLoans },
    { count: dueSoonLoans },
    { data: loans },
    { data: events },
  ] = await Promise.all([
    supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "available"),
    supabase.from("inventory_loans").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("inventory_loans").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").lt("due_date", toIsoDate(today)),
    supabase.from("inventory_loans").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").gte("due_date", toIsoDate(today)).lte("due_date", toIsoDate(soon)),
    supabase
      .from("inventory_loans")
      .select("id, borrower_name, loaned_at, due_date, inventory_items(id, name)")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("inventory_events")
      .select("id, event_type, note, created_at, inventory_items(name), inventory_categories(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <>
      <ModuleHeader
        title="Inventory"
        description="Track items, see what is available, and manage borrowed equipment."
        items={inventoryNavItems}
        action={{ href: "/dashboard/inventory/create", label: "Add item" }}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Items" value={`${totalItems ?? 0}`} detail="Tracked inventory" icon={Boxes} />
        <StatCard label="Available" value={`${availableItems ?? 0}`} detail="Ready to borrow" icon={PackageCheck} />
        <StatCard label="On Loan" value={`${activeLoans ?? 0}`} detail="Currently borrowed" icon={ClipboardList} />
        <StatCard label="Overdue" value={`${overdueLoans ?? 0}`} detail="Past due date" icon={AlertTriangle} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Active Loans</CardTitle>
                <CardDescription>{dueSoonLoans ?? 0} due today or within the next 7 days.</CardDescription>
              </div>
              <ButtonLink href="/dashboard/inventory/loans" variant="secondary" className="h-9 px-3">View all</ButtonLink>
            </div>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(loans ?? []).length ? loans?.map((loan) => {
              const dueState = getDueState(loan.due_date);

              return (
                <div key={loan.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{loan.inventory_items?.name ?? "Inventory item"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{loan.borrower_name} - due {loan.due_date ?? "No due date"}</p>
                  </div>
                  <DueLabel state={dueState} dueDate={loan.due_date} />
                </div>
              );
            }) : <EmptyState title="No active loans" description="Borrowed items will appear here." />}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common inventory tasks for daily use.</CardDescription>
          </CardHeader>
          <div className="grid gap-3 p-5 pt-0">
            <ButtonLink href="/dashboard/inventory/create" className="justify-start"><PackagePlus className="h-4 w-4" />Add item</ButtonLink>
            <ButtonLink href="/dashboard/inventory/scan" variant="secondary" className="justify-start"><ScanLine className="h-4 w-4" />Scan inventory QR</ButtonLink>
            <ButtonLink href="/dashboard/inventory/items" variant="secondary" className="justify-start">View items</ButtonLink>
            <ButtonLink href="/dashboard/inventory/loans" variant="secondary" className="justify-start">Active loans</ButtonLink>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest item changes, loans, returns, and maintenance notes.</CardDescription>
        </CardHeader>
        <div className="divide-y px-5 pb-5">
          {(events ?? []).length ? events?.map((event) => (
            <div key={event.id} className="py-3">
              <p className="text-sm font-medium">{event.inventory_items?.name ?? event.inventory_categories?.name ?? "Inventory"} - {event.event_type.replaceAll("_", " ")}</p>
              {event.note ? <p className="mt-1 text-sm text-muted-foreground">{event.note}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          )) : <EmptyState title="No inventory activity yet" description="Add your first item to begin the audit trail." />}
        </div>
      </Card>
    </>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <Boxes className="mx-auto h-9 w-9 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function DueLabel({ state, dueDate }: { state: "overdue" | "today" | "soon" | "active" | "none"; dueDate: string | null }) {
  const className =
    state === "overdue"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      : state === "today" || state === "soon"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300";
  const label = state === "overdue" ? "Overdue" : state === "today" ? "Due Today" : state === "soon" ? "Due Soon" : dueDate ? "On Loan" : "No Due Date";

  return <span className={`inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium ${className}`}>{label}</span>;
}

function getDueState(dueDate: string | null) {
  if (!dueDate) return "none";
  const today = dateOnly(new Date());
  const due = new Date(`${dueDate}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "soon";
  return "active";
}

function dateOnly(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
