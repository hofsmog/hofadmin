import { UserCheck } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkoutVisitorAction, createVisitorAction } from "@/app/dashboard/operations/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function VisitorsPage({ searchParams }: { searchParams?: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const db = supabase as any;
  const [{ data: visitors }, { data: members }] = await Promise.all([
    db.from("visitors").select("id, visitor_name, company, email, phone, status, checked_in_at, checked_out_at, notes, members(name)").eq("organization_id", organizationId).order("checked_in_at", { ascending: false }).limit(50),
    supabase.from("members").select("id, name").eq("organization_id", organizationId).order("name", { ascending: true }).limit(100),
  ]);
  return (
    <>
      <PageHeader title="Visitor Management" description="Register visitors, see who is checked in, and keep a simple visitor history." />
      <Toast show={params.created === "1"} title="Visitor checked in" message="The visitor record was created." />
      <Toast show={params.updated === "1"} title="Visitor checked out" message="The visitor record was updated." />
      <Toast show={Boolean(params.error)} tone="error" title="Visitor not saved" message="Check the visitor details and try again." />
      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card><CardHeader><CardTitle>Check in visitor</CardTitle><CardDescription>Store only the details needed for the visit.</CardDescription></CardHeader>
          <form action={createVisitorAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Visitor name</span><Input name="visitorName" required placeholder="Taylor Smith" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Company</span><Input name="company" placeholder="Company or organization" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Email</span><Input name="email" type="email" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Phone</span><Input name="phone" type="tel" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Host person</span><select name="hostMemberId" className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm dark:bg-zinc-950"><option value="">No host</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Notes</span><Input name="notes" /></label>
            <button className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Check in visitor</button>
          </form>
        </Card>
        <Card><CardHeader><CardTitle>Visitors</CardTitle><CardDescription>Current and previous visitors.</CardDescription></CardHeader>
          <div className="divide-y px-5 pb-5">
            {(visitors ?? []).length ? visitors.map((visitor: any) => <article key={visitor.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{visitor.visitor_name}</p><Badge className="capitalize">{visitor.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{[visitor.company, visitor.members?.name].filter(Boolean).join(" - ") || "No company or host"}</p><p className="mt-1 text-xs text-muted-foreground">Checked in {new Date(visitor.checked_in_at).toLocaleString()}{visitor.checked_out_at ? ` - out ${new Date(visitor.checked_out_at).toLocaleString()}` : ""}</p></div>{visitor.status === "checked_in" ? <form action={checkoutVisitorAction}><input type="hidden" name="visitorId" value={visitor.id} /><button className="h-9 rounded-xl border bg-white px-3 text-sm font-medium shadow-sm dark:bg-zinc-950">Check out</button></form> : null}</article>) : <div className="rounded-xl border border-dashed p-8 text-center"><UserCheck className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No visitors yet</p><p className="mt-1 text-sm text-muted-foreground">Checked-in visitors will appear here.</p></div>}
          </div>
        </Card>
      </div>
    </>
  );
}
