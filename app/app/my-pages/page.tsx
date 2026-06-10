import type { ComponentType } from "react";
import { AlertCircle, CalendarDays, ClipboardList, FileArchive, Inbox, Package, SquareCheckBig } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canRoleAccessModule, getModulePermissionRows } from "@/lib/module-permissions";
import { isModuleEnabled } from "@/lib/modules";
import { createMessageNameMap, getMessagePreview, type MessageTeamMember } from "@/lib/messages";

export const dynamic = "force-dynamic";

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: MessageTeamMember[] | null; error: { message: string } | null }>;
};

type MyPageSection = {
  moduleId: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  href: string | null;
  actionLabel: string;
  icon: ComponentType<{ className?: string }>;
};

const sections: MyPageSection[] = [
  {
    moduleId: "messages",
    title: "Important messages / news",
    description: "Messages and updates that may need your attention.",
    emptyTitle: "No important messages",
    emptyDescription: "New messages and organization news will appear here.",
    href: "/dashboard/messages",
    actionLabel: "Open messages",
    icon: Inbox,
  },
  {
    moduleId: "bookings",
    title: "My calendar",
    description: "Upcoming bookings connected to you.",
    emptyTitle: "No calendar items",
    emptyDescription: "Bookings and events assigned to you will appear here.",
    href: "/dashboard/bookings",
    actionLabel: "Open calendar",
    icon: CalendarDays,
  },
  {
    moduleId: "forms",
    title: "Forms I can use",
    description: "Available forms and applications.",
    emptyTitle: "No forms available",
    emptyDescription: "Forms your organization publishes for you will appear here.",
    href: "/dashboard/forms",
    actionLabel: "Open forms",
    icon: ClipboardList,
  },
  {
    moduleId: "documents",
    title: "Documents I should read",
    description: "Files and resources shared by your organization.",
    emptyTitle: "No documents assigned to you",
    emptyDescription: "Shared documents will appear here when they are ready.",
    href: "/dashboard/documents",
    actionLabel: "Open documents",
    icon: FileArchive,
  },
  {
    moduleId: "inventory",
    title: "My borrowed items",
    description: "Equipment currently borrowed by you.",
    emptyTitle: "No borrowed items",
    emptyDescription: "Items loaned to you will appear here.",
    href: "/dashboard/inventory/loans",
    actionLabel: "Open loans",
    icon: Package,
  },
  {
    moduleId: "bookings",
    title: "My bookings",
    description: "Reservations you created or are responsible for.",
    emptyTitle: "No upcoming bookings",
    emptyDescription: "Your reservations will appear here.",
    href: "/dashboard/bookings",
    actionLabel: "Open bookings",
    icon: CalendarDays,
  },
];

const quickLinks = [
  { moduleId: "messages", label: "Messages", href: "/dashboard/messages", icon: Inbox },
  { moduleId: "forms", label: "Forms", href: "/dashboard/forms", icon: ClipboardList },
  { moduleId: "documents", label: "Documents", href: "/dashboard/documents", icon: FileArchive },
  { moduleId: "bookings", label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { moduleId: "issues", label: "Issues", href: "/dashboard/issues", icon: AlertCircle },
  { moduleId: "inventory", label: "Inventory", href: "/dashboard/inventory", icon: Package },
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

  const { data: linkedMember } = user.email
    ? await supabase
        .from("members")
        .select("id, name")
        .eq("organization_id", organization.id)
        .eq("email", user.email)
        .maybeSingle()
    : { data: null };

  const now = new Date().toISOString();
  const visibleSections = sections.filter((section) => canAccess(section.moduleId));
  const canUseBookings = canAccess("bookings");
  const canUseForms = canAccess("forms");
  const canUseDocuments = canAccess("documents");
  const canUseInventory = canAccess("inventory");
  const canUseTasks = canAccess("tasks");
  const userName = getUserDisplayName(user, linkedMember?.name ?? null);

  const [
    { data: unreadMessages },
    { data: teamMembers },
    { data: availableForms },
    { data: documents },
    { data: borrowedItems },
    { data: bookings },
  ] = await Promise.all([
    supabase
      .from("internal_messages")
      .select("id, subject, body, sender_user_id, created_at")
      .eq("organization_id", organization.id)
      .eq("recipient_user_id", user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
    (supabase as unknown as TeamMemberRpcClient)
      .rpc("list_organization_team_members", { p_organization_id: organization.id })
      .then((result) => result),
    canUseForms
      ? supabase
          .from("forms")
          .select("id, title, status, created_at")
          .eq("organization_id", organization.id)
          .in("status", ["active", "published"])
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    canUseDocuments
      ? supabase
          .from("documents")
          .select("id, title, folder, created_at")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    canUseInventory && linkedMember?.id
      ? supabase
          .from("inventory_loans")
          .select("id, borrower_name, due_date, status, inventory_items(name)")
          .eq("organization_id", organization.id)
          .eq("member_id", linkedMember.id)
          .eq("status", "active")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    canUseBookings
      ? getUserBookings({
          supabase,
          organizationId: organization.id,
          userId: user.id,
          memberId: linkedMember?.id ?? null,
          now,
        })
      : Promise.resolve({ data: [] }),
  ]);

  const nameByUserId = createMessageNameMap(teamMembers ?? []);
  const needsAttention = [
    {
      label: "Unread messages",
      value: unreadMessages?.length ?? 0,
      href: "/dashboard/messages",
      show: true,
      detail: "Messages waiting",
      icon: Inbox,
    },
    {
      label: "Pending tasks",
      value: 0,
      href: "#my-tasks",
      show: canUseTasks,
      detail: "You're all caught up",
      icon: SquareCheckBig,
    },
    {
      label: "Forms to complete",
      value: availableForms?.length ?? 0,
      href: "/dashboard/forms",
      show: canUseForms,
      detail: "Available now",
      icon: ClipboardList,
    },
    {
      label: "Upcoming bookings",
      value: bookings?.length ?? 0,
      href: "/dashboard/bookings",
      show: canUseBookings,
      detail: "Coming up",
      icon: CalendarDays,
    },
  ].filter((item) => item.show);
  const visibleQuickLinks = quickLinks.filter((link) => canAccess(link.moduleId));

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-5 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge>{organization.displayName ?? organization.name}</Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                {userName ? `Welcome back, ${userName}` : "Welcome back"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Here&apos;s what needs your attention today.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {needsAttention.map((item) => (
            <ButtonLink key={item.label} href={item.href} variant="secondary" className="h-auto justify-start rounded-2xl p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm text-muted-foreground">{item.label}</span>
                <span className="mt-1 block text-2xl font-semibold">{item.value}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>
              </span>
            </ButtonLink>
          ))}
        </section>

        {visibleQuickLinks.length ? (
          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold tracking-tight">Quick links</h2>
              <p className="text-sm text-muted-foreground">Open the tools you use most.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {visibleQuickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <ButtonLink key={link.label} href={link.href} variant="secondary" className="h-24 flex-col rounded-2xl p-3 text-center">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{link.label}</span>
                  </ButtonLink>
                );
              })}
            </div>
          </section>
        ) : null}

        {canUseTasks ? (
          <Card id="my-tasks" className="scroll-mt-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>My tasks</CardTitle>
                  <CardDescription>Assigned work and follow-ups for today.</CardDescription>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <SquareCheckBig className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed p-4">
                <p className="text-sm font-medium">No tasks right now</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">You&apos;re all caught up.</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {visibleSections.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleSections.map((section) => {
              const items = getSectionItems({
                sectionId: section.title,
                unreadMessages: unreadMessages ?? [],
                availableForms: availableForms ?? [],
                documents: documents ?? [],
                borrowedItems: borrowedItems ?? [],
                bookings: bookings ?? [],
                nameByUserId,
              });

              return (
                <PersonalCard key={`${section.moduleId}-${section.title}`} section={section} items={items} />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No pages available yet</CardTitle>
              <CardDescription>Your organization has not enabled any tools for your role yet.</CardDescription>
            </CardHeader>
          </Card>
        )}

      </div>
    </main>
  );
}

async function getUserBookings({
  supabase,
  organizationId,
  userId,
  memberId,
  now,
}: {
  supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
  organizationId: string;
  userId: string;
  memberId: string | null;
  now: string;
}) {
  let query = supabase
    .from("bookings")
    .select("id, resource_name, start_at, end_at, status")
    .eq("organization_id", organizationId)
    .gte("start_at", now)
    .order("start_at", { ascending: true })
    .limit(3);

  query = memberId
    ? query.or(`created_by.eq.${userId},responsible_member_id.eq.${memberId}`)
    : query.eq("created_by", userId);

  return query;
}

function PersonalCard({
  section,
  items,
}: {
  section: MyPageSection;
  items: Array<{ title: string; detail: string; href: string | null }>;
}) {
  const Icon = section.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              item.href ? (
                <ButtonLink key={`${item.title}-${item.detail}`} href={item.href} variant="ghost" className="h-auto w-full justify-start rounded-xl bg-zinc-50 p-3 text-left dark:bg-zinc-900/60">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{item.detail}</span>
                  </span>
                </ButtonLink>
              ) : (
                <div key={`${item.title}-${item.detail}`} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4">
            <p className="text-sm font-medium">{section.emptyTitle}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.emptyDescription}</p>
          </div>
        )}
        {section.href ? (
          <ButtonLink href={section.href} variant="secondary" className="w-full">
            {section.actionLabel}
          </ButtonLink>
        ) : null}
      </CardContent>
    </Card>
  );
}

function getSectionItems({
  sectionId,
  unreadMessages,
  availableForms,
  documents,
  borrowedItems,
  bookings,
  nameByUserId,
}: {
  sectionId: string;
  unreadMessages: Array<{ id: string; subject: string; body: string; sender_user_id: string; created_at: string }>;
  availableForms: Array<{ id: string; title: string; status: string; created_at: string }>;
  documents: Array<{ id: string; title: string; folder: string; created_at: string }>;
  borrowedItems: Array<{ id: string; due_date: string | null; status: string; inventory_items: { name: string } | null }>;
  bookings: Array<{ id: string; resource_name: string; start_at: string; end_at: string; status: string }>;
  nameByUserId: Map<string, string>;
}) {
  if (sectionId === "Important messages / news") {
    return unreadMessages.map((message) => ({
      title: message.subject,
      detail: `${nameByUserId.get(message.sender_user_id) ?? "Team member"} - ${getMessagePreview(message.body)}`,
      href: `/dashboard/messages/${message.id}`,
    }));
  }

  if (sectionId === "Forms I can use") {
    return availableForms.map((form) => ({
      title: form.title,
      detail: `Available form - ${form.status}`,
      href: "/dashboard/forms",
    }));
  }

  if (sectionId === "Documents I should read") {
    return documents.map((document) => ({
      title: document.title,
      detail: document.folder,
      href: "/dashboard/documents",
    }));
  }

  if (sectionId === "My borrowed items") {
    return borrowedItems.map((loan) => ({
      title: loan.inventory_items?.name ?? "Borrowed item",
      detail: loan.due_date ? `Due ${new Date(loan.due_date).toLocaleDateString()}` : "No due date",
      href: "/dashboard/inventory/loans",
    }));
  }

  if (sectionId === "My calendar" || sectionId === "My bookings") {
    return bookings.map((booking) => ({
      title: booking.resource_name,
      detail: `${new Date(booking.start_at).toLocaleString()} - ${booking.status}`,
      href: "/dashboard/bookings",
    }));
  }

  return [];
}

function getUserDisplayName(
  user: Awaited<ReturnType<typeof requireOrganizationContext>>["user"],
  memberName: string | null,
) {
  const metadata = user.user_metadata ?? {};
  const metadataName =
    typeof metadata.full_name === "string" ? metadata.full_name :
      typeof metadata.name === "string" ? metadata.name :
        "";
  const name = metadataName.trim() || memberName?.trim() || "";

  if (!name) {
    return "";
  }

  return name.split(" ")[0] || name;
}
