import { KeyRound } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createKeyAction } from "@/app/dashboard/operations/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function KeysPage({ searchParams }: { searchParams?: Promise<{ created?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const [{ data: keys }, { data: members }] = await Promise.all([
    db.from("key_items").select("id, key_number, name, category, location, status, loan_date, return_date, members(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
  ]);
  return (
    <>
      <PageHeader title="Key Management" description="Track keys, holders, return dates, lost keys, and handover history." />
      <Toast show={params.created === "1"} title="Key saved" message="The key record was added." />
      <Toast show={Boolean(params.error)} tone="error" title="Key not saved" message="Check the key details and try again." />
      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card><CardHeader><CardTitle>Register key</CardTitle><CardDescription>Issue it immediately or leave it available.</CardDescription></CardHeader>
          <form action={createKeyAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Key name</span><Input name="name" required placeholder="Main entrance key" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Key number</span><Input name="keyNumber" required placeholder="K-204" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Category</span><Input name="category" placeholder="Building, Storage, Vehicle" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Location</span><Input name="location" placeholder="Office key cabinet" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Current holder</span><select name="holderMemberId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">No holder</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Loan date</span><Input name="loanDate" type="date" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Return date</span><Input name="returnDate" type="date" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Notes</span><Input name="notes" placeholder="Optional note" /></label>
            <button className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Save key</button>
          </form>
        </Card>
        <Card><CardHeader><CardTitle>Keys</CardTitle><CardDescription>Current holder and overdue status at a glance.</CardDescription></CardHeader>
          <div className="divide-y px-5 pb-5">
            {(keys ?? []).length ? keys.map((key: any) => <article key={key.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{key.name}</p><Badge>{key.key_number}</Badge><Badge className="capitalize">{key.status.replaceAll("_", " ")}</Badge>{isOverdue(key.return_date, key.status) ? <Badge className="border-red-200 bg-red-50 text-red-800">Overdue</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">{key.members?.name || "No current holder"} - return {key.return_date || "No date"}</p><p className="mt-1 text-xs text-muted-foreground">{[key.category, key.location].filter(Boolean).join(" - ") || "No category or location"}</p></article>) : <div className="rounded-xl border border-dashed p-8 text-center"><KeyRound className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No keys yet</p><p className="mt-1 text-sm text-muted-foreground">Register keys to track handovers and returns.</p></div>}
          </div>
        </Card>
      </div>
    </>
  );
}

function isOverdue(returnDate: string | null, status: string) {
  if (!returnDate || status !== "on_loan") return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(`${returnDate}T00:00:00`) < today;
}
