import { notFound } from "next/navigation";
import { AlertTriangle, Calendar, MapPin, QrCode, UserRound } from "lucide-react";
import { updateInventoryItemStatusAction } from "@/app/dashboard/modules/inventory/actions";
import { InventoryLoanAgreementForm } from "@/components/dashboard/inventory/inventory-loan-agreement-form";
import { InventoryConditionBadge, InventoryStatusBadge, inventoryConditionLabels, inventoryStatusLabels } from "@/components/dashboard/inventory/inventory-badges";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { QrCodeCard } from "@/components/dashboard/qr-code-card";
import { Toast } from "@/components/ui/toast";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { inventoryNavItems } from "@/lib/module-nav";
import type { InventoryItemCondition, InventoryItemStatus } from "@/types/database";

const statuses: InventoryItemStatus[] = ["available", "in_use", "maintenance", "lost", "retired"];
const conditions: InventoryItemCondition[] = ["new", "good", "fair", "poor", "broken"];

export default async function InventoryDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ updated?: string; loaned?: string; error?: string }> }) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ data: item }, { data: members }, { data: events }, { data: loans }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, description, asset_tag, serial_number, status, condition, location, assigned_to_member_id, loan_due_date, loan_note, last_assigned_at, last_returned_at, qr_value, purchase_date, purchase_price, notes, created_at, inventory_categories(name, color)")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single(),
    supabase.from("members").select("id, name, email, phone").eq("organization_id", organizationId).order("name", { ascending: true }),
    supabase.from("inventory_events").select("id, event_type, note, created_at").eq("inventory_item_id", id).eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(10),
    supabase
      .from("inventory_loans")
      .select("id, member_id, loaned_at, due_date, returned_at, status, loan_note, agreement_text, borrower_name, signature_data_url, signed_at, created_at")
      .eq("inventory_item_id", id)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (!item) notFound();
  const assignedMemberName = item.assigned_to_member_id ? members?.find((member) => member.id === item.assigned_to_member_id)?.name ?? "Unknown member" : "Unassigned";
  const loanState = getLoanState(item.loan_due_date, item.status);
  const activeLoan = (loans ?? []).find((loan) => loan.status === "active");

  return (
    <>
      <ModuleHeader title={item.name} description="Inventory item detail, QR readiness, assignment, status, and event history." items={inventoryNavItems} />
      <Toast show={query.updated === "1"} title="Inventory item updated" message="Status, assignment, and notes were saved." />
      <Toast show={query.loaned === "1"} title="Loan completed" message="The agreement was signed and the item is now loaned out." />
      <Toast show={Boolean(query.error)} tone="error" title="Could not update item" message="Please review the details and try again." />
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description ?? "No description"}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <InventoryStatusBadge status={item.status} />
                  <InventoryConditionBadge condition={item.condition} />
                  {loanState === "overdue" ? <Badge className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">Overdue</Badge> : null}
                  {loanState === "due_soon" ? <Badge className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Due soon</Badge> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Info icon={QrCode} label="Asset tag" value={item.asset_tag ?? "No asset tag"} />
              <Info icon={QrCode} label="Serial number" value={item.serial_number ?? "No serial number"} />
              <Info icon={QrCode} label="Category" value={item.inventory_categories?.name ?? "Uncategorized"} />
              <Info icon={MapPin} label="Location" value={item.location ?? "No location"} />
              <Info icon={UserRound} label="Assigned to" value={assignedMemberName} />
              <Info icon={Calendar} label="Due date" value={item.loan_due_date ?? "No due date"} />
              <Info icon={Calendar} label="Assigned" value={item.last_assigned_at ? new Date(item.last_assigned_at).toLocaleString() : "Not assigned yet"} />
              <Info icon={Calendar} label="Last returned" value={item.last_returned_at ? new Date(item.last_returned_at).toLocaleString() : "Not returned yet"} />
              <Info icon={Calendar} label="Purchase date" value={item.purchase_date ?? "Not recorded"} />
              <Info icon={Calendar} label="Purchase price" value={item.purchase_price ? `${item.purchase_price}` : "Not recorded"} />
            </CardContent>
          </Card>

          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {item.assigned_to_member_id ? (
                  <div className="mt-1">
                    <p className="text-xl font-semibold">Loaned to: {assignedMemberName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Return date: {item.loan_due_date ?? "No return date"}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-xl font-semibold">Available</p>
                )}
              </div>
              <ButtonLink href="#loan-item" className="h-12 px-6 text-base">
                Loan Item
              </ButtonLink>
            </div>
            {activeLoan ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/dashboard/inventory/loans/${activeLoan.id}`} variant="secondary" className="h-10 px-3">
                  View Loan Agreement
                </ButtonLink>
                <QuickInventoryAction item={item} status="available" assignedToMemberId="" label="Return Item" note="Item was returned and is available." />
              </div>
            ) : null}
          </div>

          <Card className={loanState === "overdue" ? "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20" : ""}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-200">
                  {loanState === "overdue" ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <UserRound className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle>Current holder</CardTitle>
                  <CardDescription>
                    {item.assigned_to_member_id ? `${assignedMemberName}${item.loan_due_date ? ` - due ${item.loan_due_date}` : ""}` : "This item is currently available."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {item.loan_note ? (
              <CardContent>
                <div className="rounded-xl border bg-white p-3 text-sm text-muted-foreground dark:bg-zinc-950">
                  {item.loan_note}
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan agreement</CardTitle>
              <CardDescription>{activeLoan ? "Current signed agreement for this loan." : "No active signed loan agreement."}</CardDescription>
            </CardHeader>
            <CardContent>
              {activeLoan ? (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{activeLoan.borrower_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Signed {new Date(activeLoan.signed_at).toLocaleString()}</p>
                        {activeLoan.due_date ? <p className="mt-1 text-sm text-muted-foreground">Due {activeLoan.due_date}</p> : null}
                      </div>
                      <ButtonLink href={`/dashboard/inventory/loans/${activeLoan.id}`} variant="secondary" className="h-9 px-3">
                        View agreement
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm font-medium">No signed agreement yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Assign this item to a member to capture a signature.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>Common inventory updates for assignment and lifecycle tracking.</CardDescription>
                </div>
                <ButtonLink href="#loan-item" variant="secondary" className="h-9 px-3">
                  Loan Item
                </ButtonLink>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <QuickInventoryAction item={item} status="available" assignedToMemberId="" label="Mark as returned" note="Item was returned and is available." />
              <QuickInventoryAction item={item} status="maintenance" label="Send to maintenance" note="Item was sent to maintenance." />
              <QuickInventoryAction item={item} status="lost" label="Mark as lost" note="Item was marked as lost." />
              <QuickInventoryAction item={item} status="retired" label="Retire item" note="Item was retired from inventory." />
            </CardContent>
          </Card>

          {item.qr_value ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">Inventory QR</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Scan this code to open the item detail page.</p>
                </div>
                <ButtonLink href="/dashboard/inventory/scan" variant="secondary" className="h-9 px-3">
                  <QrCode className="h-4 w-4" />
                  Open scanner
                </ButtonLink>
              </div>
              <QrCodeCard
                organizationName={organizationContext.activeOrganization.name}
                item={{
                  id: item.id,
                  name: item.name,
                  type: "asset",
                  description: "Inventory QR value for opening this item detail page.",
                  qr_value: item.qr_value,
                  is_active: item.status !== "retired",
                  created_at: item.created_at,
                }}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>No QR value yet</CardTitle>
                    <CardDescription>This item can receive an inventory QR value when recreated with QR enabled.</CardDescription>
                  </div>
                  <ButtonLink href="/dashboard/inventory/scan" variant="secondary" className="h-9 px-3">
                    <QrCode className="h-4 w-4" />
                    Open scanner
                  </ButtonLink>
                </div>
              </CardHeader>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Event history</CardTitle><CardDescription>Audit trail for inventory changes.</CardDescription></CardHeader>
            <div className="divide-y px-5 pb-5">
              {(events ?? []).length ? events?.map((event) => (
                <div key={event.id} className="py-3">
                  <p className="text-sm font-medium capitalize">{event.event_type.replaceAll("_", " ")}</p>
                  {event.note ? <p className="mt-1 text-sm text-muted-foreground">{event.note}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              )) : <p className="py-6 text-sm text-muted-foreground">No events yet.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Loan history</CardTitle><CardDescription>Signed agreements and returns for this item.</CardDescription></CardHeader>
            <div className="divide-y px-5 pb-5">
              {(loans ?? []).length ? loans?.map((loan) => (
                <div key={loan.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{loan.borrower_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{loan.status} - loaned {new Date(loan.loaned_at).toLocaleDateString()}{loan.due_date ? ` - due ${loan.due_date}` : ""}</p>
                  </div>
                  <ButtonLink href={`/dashboard/inventory/loans/${loan.id}`} variant="ghost" className="h-8 px-2">View</ButtonLink>
                </div>
              )) : <p className="py-6 text-sm text-muted-foreground">No loan history yet.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
        <Card id="loan-item">
          <CardHeader><CardTitle>Loan Item</CardTitle><CardDescription>One clear step at a time: borrower, return date, agreement, signature, complete.</CardDescription></CardHeader>
          <CardContent>
            <InventoryLoanAgreementForm
              itemId={item.id}
              itemName={item.name}
              members={members ?? []}
              agreementTemplate={organizationContext.activeOrganization.defaultLoanAgreementText}
              defaultMemberId={item.assigned_to_member_id}
              defaultDueDate={item.loan_due_date}
              defaultNote={item.loan_note}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Item controls</CardTitle><CardDescription>Change status, update location, and record internal notes. Use signed assignment above for loans.</CardDescription></CardHeader>
          <CardContent>
            <form action={updateInventoryItemStatusAction} className="space-y-4">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="assignedToMemberId" value={item.assigned_to_member_id ?? ""} />
              <input type="hidden" name="loanDueDate" value={item.loan_due_date ?? ""} />
              <input type="hidden" name="loanNote" value={item.loan_note ?? ""} />
              <Select name="status" label="Status" defaultValue={item.status}>{statuses.map((status) => <option key={status} value={status}>{inventoryStatusLabels[status]}</option>)}</Select>
              <Select name="condition" label="Condition" defaultValue={item.condition}>{conditions.map((condition) => <option key={condition} value={condition}>{inventoryConditionLabels[condition]}</option>)}</Select>
              <label className="block space-y-2"><span className="text-sm font-medium">Location</span><input name="location" defaultValue={item.location ?? ""} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Notes</span><textarea name="notes" defaultValue={item.notes ?? ""} rows={4} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Event note</span><input name="eventNote" placeholder="What changed?" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" /></label>
              <button type="submit" className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950">Save update</button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
}

function QuickInventoryAction({
  item,
  status,
  assignedToMemberId,
  label,
  note,
}: {
  item: {
    id: string;
    status: InventoryItemStatus;
    condition: InventoryItemCondition;
    location: string | null;
    assigned_to_member_id: string | null;
    loan_due_date: string | null;
    loan_note: string | null;
    notes: string | null;
  };
  status: InventoryItemStatus;
  assignedToMemberId?: string;
  label: string;
  note: string;
}) {
  return (
    <form action={updateInventoryItemStatusAction}>
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="condition" value={item.condition} />
      <input type="hidden" name="assignedToMemberId" value={assignedToMemberId ?? item.assigned_to_member_id ?? ""} />
      <input type="hidden" name="loanDueDate" value={assignedToMemberId === "" ? "" : item.loan_due_date ?? ""} />
      <input type="hidden" name="loanNote" value={assignedToMemberId === "" ? "" : item.loan_note ?? ""} />
      <input type="hidden" name="location" value={item.location ?? ""} />
      <input type="hidden" name="notes" value={item.notes ?? ""} />
      <input type="hidden" name="eventNote" value={note} />
      <button type="submit" className="h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
        {label}
      </button>
    </form>
  );
}

function Select({ name, label, defaultValue, children }: { name: string; label: string; defaultValue: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><select name={name} defaultValue={defaultValue} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950">{children}</select></label>;
}

function Info({ icon: Icon, label, value }: { icon: typeof QrCode; label: string; value: string }) {
  return <div className="flex gap-3 rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-zinc-700 dark:bg-zinc-950"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="break-words text-sm font-medium">{value}</p></div></div>;
}

function getLoanState(dueDate: string | null, status: InventoryItemStatus) {
  if (!dueDate || status !== "in_use") {
    return "none";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);

  if (daysUntilDue < 0) {
    return "overdue";
  }

  if (daysUntilDue <= 7) {
    return "due_soon";
  }

  return "active";
}
