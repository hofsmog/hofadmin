"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createMemberAction, type MemberFormState } from "@/app/dashboard/modules/members/actions";
import { ActionSubmitButton } from "@/components/dashboard/action-submit-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

const initialState: MemberFormState = {
  status: "idle",
  message: "",
};

const memberTypes = [
  ["student", "Student"],
  ["staff", "Staff"],
  ["player", "Player"],
  ["volunteer", "Volunteer"],
  ["employee", "Employee"],
  ["customer", "Customer"],
  ["guest", "Guest"],
  ["other", "Other"],
] as const;

export function MemberCreateForm() {
  const [state, action] = useActionState(createMemberAction, initialState);

  return (
    <Card id="add-member" className="overflow-hidden">
      <Toast
        show={state.status === "success" || state.status === "error"}
        tone={state.status === "error" ? "error" : "success"}
        title={state.status === "error" ? "Member not added" : "Member added"}
        message={state.message}
      />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Add member</CardTitle>
            <CardDescription>Create organization-scoped member records for future QR and check-in workflows.</CardDescription>
          </div>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <form action={action} className="grid gap-4 p-5 pt-0 md:grid-cols-2">
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Name</span>
          <Input name="name" placeholder="Alex Morgan" required />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Member number</span>
          <Input name="memberNumber" placeholder="M-1004" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Type</span>
          <select name="type" defaultValue="other" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            {memberTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select name="status" defaultValue="active" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <Input name="email" type="email" placeholder="alex@example.com" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Phone</span>
          <Input name="phone" type="tel" placeholder="+46..." />
        </label>
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Tags</span>
          <Input name="tags" placeholder="Grade 6, Board, Goalkeeper" />
          <span className="text-xs text-muted-foreground">Separate tags with commas.</span>
        </label>
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <Input name="notes" placeholder="Team, class, preference, or internal note" />
        </label>
        <div className="md:col-span-2">
          <ActionSubmitButton pendingLabel="Adding member" className="h-11">
            Add member
          </ActionSubmitButton>
        </div>
      </form>
    </Card>
  );
}
