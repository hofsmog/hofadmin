import { CalendarDays, ClipboardList, FileArchive, Inbox, Package, SquareCheckBig } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canRoleAccessModule, getModulePermissionRows } from "@/lib/module-permissions";
import { isModuleEnabled } from "@/lib/modules";

export const dynamic = "force-dynamic";

const myPageCards = [
  {
    moduleId: "messages",
    title: "Messages and news",
    description: "Unread messages and organization updates will appear here.",
    href: "/dashboard/messages",
    icon: Inbox,
  },
  {
    moduleId: "bookings",
    title: "My calendar",
    description: "Bookings and upcoming organization dates.",
    href: "/dashboard/bookings",
    icon: CalendarDays,
  },
  {
    moduleId: "tasks",
    title: "My tasks",
    description: "Assigned tasks and follow-ups will appear here.",
    href: null,
    icon: SquareCheckBig,
  },
  {
    moduleId: "forms",
    title: "Forms",
    description: "Forms you can complete or review.",
    href: "/dashboard/forms",
    icon: ClipboardList,
  },
  {
    moduleId: "documents",
    title: "Documents",
    description: "Files and resources shared with you.",
    href: "/dashboard/documents",
    icon: FileArchive,
  },
  {
    moduleId: "inventory",
    title: "My borrowed items",
    description: "Equipment and items currently assigned to you.",
    href: "/dashboard/inventory/loans",
    icon: Package,
  },
  {
    moduleId: "bookings",
    title: "My bookings",
    description: "Reservations connected to you.",
    href: "/dashboard/bookings",
    icon: CalendarDays,
  },
] as const;

export default async function MyPagesPage() {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organization = organizationContext.activeOrganization;
  const permissionRows = await getModulePermissionRows(supabase, organization.id);
  const canAccess = (moduleId: string) =>
    moduleId === "messages" ||
    (
      isModuleEnabled(moduleId, organization) &&
      canRoleAccessModule({
        moduleId,
        role: organizationContext.activeMembership.role,
        organization,
        permissionRows,
      })
    );

  const [
    { count: unreadMessages },
    { count: availableForms },
    { count: documents },
    { count: activeLoans },
    { count: myBookings },
  ] = await Promise.all([
    supabase
      .from("internal_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("recipient_user_id", user.id)
      .is("read_at", null),
    canAccess("forms")
      ? supabase
          .from("forms")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .in("status", ["active", "published"])
      : Promise.resolve({ count: 0 }),
    canAccess("documents")
      ? supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id)
      : Promise.resolve({ count: 0 }),
    canAccess("inventory")
      ? supabase
          .from("inventory_loans")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .eq("status", "active")
      : Promise.resolve({ count: 0 }),
    canAccess("bookings")
      ? supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const cardCounts = new Map<string, number>([
    ["messages", unreadMessages ?? 0],
    ["forms", availableForms ?? 0],
    ["documents", documents ?? 0],
    ["inventory", activeLoans ?? 0],
    ["bookings", myBookings ?? 0],
  ]);
  const visibleCards = myPageCards.filter((card) => canAccess(card.moduleId));

  return (
    <>
      <PageHeader
        title="My Pages"
        description={`Your tools and updates for ${organization.displayName ?? organization.name}.`}
      />
      {visibleCards.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            const count = cardCounts.get(card.moduleId) ?? 0;

            return (
              <Card key={`${card.moduleId}-${card.title}`} className="min-h-56">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    {count > 0 ? <Badge>{count}</Badge> : null}
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {card.href ? (
                    <ButtonLink href={card.href} variant="secondary" className="w-full">
                      Open
                    </ButtonLink>
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      Nothing assigned yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No pages available yet</CardTitle>
            <CardDescription>
              Your organization has not enabled any tools for your role yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
