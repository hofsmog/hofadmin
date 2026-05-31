"use client";

import { useActionState } from "react";
import { PackagePlus } from "lucide-react";
import { createInventoryItemAction, type InventoryFormState } from "@/app/dashboard/modules/inventory/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import type { Database } from "@/types/database";

type Category = Pick<Database["public"]["Tables"]["inventory_categories"]["Row"], "id" | "name">;
type Member = Pick<Database["public"]["Tables"]["members"]["Row"], "id" | "name">;
const initialState: InventoryFormState = { status: "idle", message: "" };

export function InventoryCreateForm({ categories, members }: { categories: Category[]; members: Member[] }) {
  const [state, action] = useActionState(createInventoryItemAction, initialState);

  return (
    <Card id="add-inventory-item" className="overflow-hidden">
      <Toast
        show={state.status === "success" || state.status === "error"}
        tone={state.status === "error" ? "error" : "success"}
        title={state.status === "error" ? "Item not created" : "Inventory item created"}
        message={state.message}
      />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Add inventory item</CardTitle>
            <CardDescription>Track equipment, kits, devices, keys, and reusable assets.</CardDescription>
          </div>
          <PackagePlus className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <form action={action} className="space-y-5 p-5 pt-0">
        <section className="grid gap-4 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60 md:grid-cols-2">
          <SectionHeading title="Item basics" description="Name the asset and add the identifiers people search for." />
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Name</span>
            <Input name="name" required placeholder="Laptop cart charger" />
          </label>
          <Select name="categoryId" label="Category" defaultValue="">
            <option value="">No category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Asset tag</span>
            <Input name="assetTag" placeholder="HA-LAP-001" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Serial number</span>
            <Input name="serialNumber" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Location</span>
            <Input name="location" placeholder="Storage room A" />
          </label>
        </section>

        <section className="grid gap-4 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60 md:grid-cols-2">
          <SectionHeading title="Status and assignment" description="Track availability, condition, and who has the item." />
          <Select name="status" label="Status" defaultValue="available">
            <option value="available">Available</option>
            <option value="in_use">In use</option>
            <option value="maintenance">Maintenance</option>
            <option value="lost">Lost</option>
            <option value="retired">Retired</option>
          </Select>
          <Select name="condition" label="Condition" defaultValue="good">
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="broken">Broken</option>
          </Select>
          <Select name="assignedToMemberId" label="Assigned member" defaultValue="">
            <option value="">Unassigned</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </Select>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Due date</span>
            <Input name="loanDueDate" type="date" />
          </label>
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Loan note</span>
            <Input name="loanNote" placeholder="Optional handover note" />
          </label>
        </section>

        <section className="grid gap-4 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60 md:grid-cols-2">
          <SectionHeading title="Purchase and notes" description="Optional details for finance, maintenance, and handovers." />
          <label className="block space-y-2">
            <span className="text-sm font-medium">Purchase date</span>
            <Input name="purchaseDate" type="date" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Purchase price</span>
            <Input name="purchasePrice" type="number" min="0" step="0.01" />
          </label>
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Notes</span>
            <textarea name="notes" rows={4} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800" />
          </label>
          <label className="flex items-start gap-3 rounded-xl border bg-white p-4 dark:bg-zinc-950 md:col-span-2">
            <input name="generateQr" type="checkbox" className="mt-1 h-4 w-4 rounded border-zinc-300" />
            <span>
              <span className="block text-sm font-medium">Generate reusable inventory QR value</span>
              <span className="mt-1 block text-sm text-muted-foreground">Prepared for future scan-to-item workflows and printable labels.</span>
            </span>
          </label>
        </section>

        <div>
          <ActionSubmitButton pendingLabel="Creating item" className="h-11">
            Add inventory item
          </ActionSubmitButton>
        </div>
      </form>
    </Card>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="md:col-span-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Select({ name, label, defaultValue, children }: { name: string; label: string; defaultValue: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
        {children}
      </select>
    </label>
  );
}
