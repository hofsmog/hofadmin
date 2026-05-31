import type { ComponentType } from "react";
import { Search, UserRoundCheck, UsersRound } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { membersNavItems } from "@/lib/module-nav";
import type { MemberStatus, MemberType } from "@/types/database";

const memberTypes: Array<{ label: string; value: MemberType | "all" }> = [
  { label: "All types", value: "all" }, { label: "Student", value: "student" }, { label: "Staff", value: "staff" }, { label: "Player", value: "player" },
  { label: "Volunteer", value: "volunteer" }, { label: "Employee", value: "employee" }, { label: "Customer", value: "customer" }, { label: "Guest", value: "guest" }, { label: "Other", value: "other" },
];

export default async function MembersListPage({ searchParams }: { searchParams?: Promise<{ q?: string; status?: MemberStatus | "all"; type?: MemberType | "all" }> }) {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").trim();
  const searchTerm = q.replace(/[%,()]/g, "").trim();
  const status = params.status ?? "all";
  const type = params.type ?? "all";
  let membersQuery = supabase.from("members").select("*").eq("organization_id", organizationContext.activeOrganization.id).order("created_at", { ascending: false });
  if (searchTerm) membersQuery = membersQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
  if (status !== "all") membersQuery = membersQuery.eq("status", status);
  if (type !== "all") membersQuery = membersQuery.eq("type", type);
  const [{ data: members }, { count: totalMembers }, { count: activeMembers }] = await Promise.all([
    membersQuery,
    supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organizationContext.activeOrganization.id),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organizationContext.activeOrganization.id).eq("status", "active"),
  ]);

  return (
    <>
      <ModuleHeader title="Member List" description="Search and filter organization member records." items={membersNavItems} action={{ href: "/dashboard/members/create", label: "Add member" }} />
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <MetricCard icon={UsersRound} label="Total members" value={totalMembers ?? 0} />
        <MetricCard icon={UserRoundCheck} label="Active members" value={activeMembers ?? 0} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Member directory</CardTitle>
          <CardDescription>Search, filter, and review member records.</CardDescription>
        </CardHeader>
        <form className="grid gap-3 p-5 pt-0 md:grid-cols-[1fr_10rem_10rem_auto]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={q} placeholder="Search members" className="pl-9" /></div>
          <select name="status" defaultValue={status} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <select name="type" defaultValue={type} className="h-11 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800">{memberTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950" type="submit">Filter</button>
        </form>
        <div className="divide-y px-5 pb-5">
          {(members ?? []).length ? members?.map((member) => (
            <div key={member.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{member.name}</p><Badge className="capitalize">{member.type}</Badge><Badge>{member.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{[member.email, member.phone].filter(Boolean).join(" · ") || "No contact details"}</p>{member.notes ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{member.notes}</p> : null}</div>
              <p className="text-xs text-muted-foreground">Created {new Date(member.created_at).toLocaleDateString()}</p>
            </div>
          )) : <div className="rounded-xl border border-dashed p-8 text-center"><UsersRound className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No members found</p><p className="mt-1 text-sm text-muted-foreground">Add your first member or adjust filters.</p></div>}
        </div>
      </Card>
    </>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: number }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><Icon className="h-5 w-5" /></div></div></Card>;
}
