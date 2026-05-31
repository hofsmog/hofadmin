import { CheckCircle2, Clock3, Plus, QrCode, ScanLine } from "lucide-react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { qrNavItems } from "@/lib/module-nav";

export default async function QrOverviewPage() {
  const { supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const [{ count: totalQrItems }, { count: todayCheckins }, { data: qrItems }, { data: checkins }] =
    await Promise.all([
      supabase.from("qr_items").select("*", { count: "exact", head: true }).eq("organization_id", organizationId),
      supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase
        .from("qr_items")
        .select("id, name, type, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("checkins")
        .select("id, qr_item_id, attendee_name, notes, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const qrItemsById = new Map((qrItems ?? []).map((item) => [item.id, item]));

  return (
    <>
      <ModuleHeader
        title="QR + Check-ins"
        description="Create QR access points, scan arrivals, and review check-in activity."
        items={qrNavItems}
        action={{ href: "/dashboard/qr/items#create-qr", label: "Create QR" }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="QR items" value={`${totalQrItems ?? 0}`} detail="Reusable scan targets" icon={QrCode} />
        <StatCard label="Check-ins today" value={`${todayCheckins ?? 0}`} detail="Since local midnight" icon={CheckCircle2} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Recent QR items</CardTitle>
                <CardDescription>Newest generated QR targets.</CardDescription>
              </div>
              <QrCode className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(qrItems ?? []).length ? (
              qrItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{item.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <EmptyCopy title="No QR items yet" description="Create your first QR item to start scanning." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Recent check-ins</CardTitle>
                <CardDescription>Latest scan and manual entries.</CardDescription>
              </div>
              <Clock3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="divide-y px-5 pb-5">
            {(checkins ?? []).length ? (
              checkins?.map((checkin) => {
                const item = checkin.qr_item_id ? qrItemsById.get(checkin.qr_item_id) : null;
                return (
                  <div key={checkin.id} className="py-3">
                    <p className="text-sm font-medium">{item?.name ?? "Unknown QR item"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(checkin.created_at).toLocaleString()}</p>
                  </div>
                );
              })
            ) : (
              <EmptyCopy title="No check-ins yet" description="Open the scanner or register a manual check-in." />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/dashboard/qr/items#create-qr">
          <Plus className="h-4 w-4" />
          Create QR
        </ButtonLink>
        <ButtonLink href="/dashboard/qr/scanner" variant="secondary">
          <ScanLine className="h-4 w-4" />
          Open scanner
        </ButtonLink>
      </div>
    </>
  );
}

function EmptyCopy({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
