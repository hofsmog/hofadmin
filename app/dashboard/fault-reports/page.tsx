import { Camera, Inbox } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFaultReportAction } from "@/app/dashboard/operations/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export default async function FaultReportsPage({ searchParams }: { searchParams?: Promise<{ created?: string; error?: string }> }) {
  const params = (await searchParams) ?? {};
  const { supabase, organizationContext } = await requireOrganizationContext();
  const db = supabase as any;
  const { data: reports } = await db.from("fault_reports").select("id, title, description, location, category, status, contact_person, created_at").eq("organization_id", organizationContext.activeOrganization.id).order("created_at", { ascending: false }).limit(50);

  return (
    <>
      <PageHeader title="Fault Reports" description="Report problems and turn them into trackable issues." />
      <Toast show={params.created === "1"} title="Fault report submitted" message="An issue was created for follow-up." />
      <Toast show={Boolean(params.error)} tone="error" title="Fault report not saved" message="Check the report details and try again." />
      <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card><CardHeader><CardTitle>New fault report</CardTitle><CardDescription>For broken equipment, facility issues, WiFi problems, and damage.</CardDescription></CardHeader>
          <form action={createFaultReportAction} className="space-y-4 p-5 pt-0">
            <label className="block space-y-2"><span className="text-sm font-medium">Title</span><Input name="title" required placeholder="Broken projector" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Location</span><Input name="location" placeholder="Room 204" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Category</span><Input name="category" placeholder="IT, Furniture, Facility" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Description</span><textarea name="description" rows={4} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm dark:bg-zinc-950" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Contact person</span><Input name="contactPerson" placeholder="Name" /></label>
            <label className="block space-y-2"><span className="text-sm font-medium">Contact email</span><Input name="contactEmail" type="email" placeholder="name@example.com" /></label>
            <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"><Camera className="h-4 w-4" />Submit report</button>
          </form>
        </Card>
        <Card><CardHeader><CardTitle>Report inbox</CardTitle><CardDescription>Newest fault reports for admin handling.</CardDescription></CardHeader>
          <div className="divide-y px-5 pb-5">
            {(reports ?? []).length ? reports.map((report: any) => <article key={report.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{report.title}</p><Badge className="capitalize">{report.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{report.description || "No description"}</p><p className="mt-1 text-xs text-muted-foreground">{[report.location, report.category, report.contact_person].filter(Boolean).join(" - ") || "No details"} - {new Date(report.created_at).toLocaleString()}</p></article>) : <div className="rounded-xl border border-dashed p-8 text-center"><Inbox className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No fault reports yet</p><p className="mt-1 text-sm text-muted-foreground">Submitted reports will appear here.</p></div>}
          </div>
        </Card>
      </div>
    </>
  );
}
