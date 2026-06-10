"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarDays, ClipboardList, FileArchive, Home, Loader2, LogOut, Menu, MessageSquare, Package, X } from "lucide-react";
import { useState } from "react";
import { MessagesAutoRefresh } from "@/components/dashboard/messages-auto-refresh";
import { OrganizationAvatar } from "@/components/dashboard/organization-avatar";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { BrandLockup } from "@/components/ui/brand";
import { createClient } from "@/lib/supabase/client";
import { canRoleAccessModule, type ModulePermissionRow } from "@/lib/module-permissions";
import { isModuleEnabled } from "@/lib/modules";
import { cn } from "@/lib/utils";
import type { OrganizationContext } from "@/types";

const userNavItems = [
  { title: "My Pages", href: "/app/my-pages", icon: Home, moduleId: "dashboard", system: true },
  { title: "Messages", href: "/app/messages", icon: MessageSquare, system: true },
  { title: "Forms", href: "/dashboard/forms", icon: ClipboardList, moduleId: "forms" },
  { title: "Documents", href: "/dashboard/documents", icon: FileArchive, moduleId: "documents" },
  { title: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, moduleId: "bookings" },
  { title: "Inventory", href: "/dashboard/inventory", icon: Package, moduleId: "inventory" },
] as const;

export function AppShell({
  children,
  userId,
  userEmail,
  organizationContext,
  unreadMessagesCount = 0,
  modulePermissionRows = [],
}: {
  children: React.ReactNode;
  userId: string;
  userEmail: string;
  organizationContext: OrganizationContext;
  unreadMessagesCount?: number;
  modulePermissionRows?: ModulePermissionRow[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initials = getInitials(userEmail);
  const accentColor = organizationContext.activeOrganization.accentColor ?? "#111827";
  const backgroundColor = organizationContext.activeOrganization.backgroundColor ?? undefined;

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50" style={backgroundColor ? { backgroundColor } : undefined}>
      <MessagesAutoRefresh organizationId={organizationContext.activeOrganization.id} userId={userId} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-white/90 backdrop-blur-xl dark:bg-zinc-950/90 lg:flex lg:flex-col">
        <AppSidebar
          pathname={pathname}
          organizationContext={organizationContext}
          unreadMessagesCount={unreadMessagesCount}
          modulePermissionRows={modulePermissionRows}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[min(22rem,88vw)] border-r bg-white shadow-2xl dark:bg-zinc-950">
            <div className="absolute right-3 top-3">
              <button
                aria-label="Close sidebar"
                className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AppSidebar
              pathname={pathname}
              organizationContext={organizationContext}
              unreadMessagesCount={unreadMessagesCount}
              modulePermissionRows={modulePermissionRows}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white/85 px-4 backdrop-blur-xl dark:bg-zinc-950/85 sm:px-6">
          <button
            aria-label="Open navigation"
            className="rounded-xl border bg-white p-2 shadow-sm dark:bg-zinc-900 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name}</p>
            <p className="text-xs text-muted-foreground">Personal workspace</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              aria-label="Messages"
              href="/app/messages"
              className="relative rounded-xl border bg-white p-2 shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <Bell className="h-5 w-5" />
              {unreadMessagesCount > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-900" style={{ backgroundColor: accentColor }} />
              ) : null}
            </Link>
            <div className="grid h-9 w-9 place-items-center rounded-xl border bg-white text-xs font-semibold shadow-sm dark:bg-zinc-900">
              {initials}
            </div>
            <button
              type="button"
              aria-label="Logout"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function AppSidebar({
  pathname,
  organizationContext,
  unreadMessagesCount,
  modulePermissionRows,
  onNavigate,
}: {
  pathname: string;
  organizationContext: OrganizationContext;
  unreadMessagesCount: number;
  modulePermissionRows: ModulePermissionRow[];
  onNavigate?: () => void;
}) {
  const navItems = userNavItems.filter((item) => {
    if (!("moduleId" in item) || !item.moduleId) {
      return true;
    }

    if ("system" in item && item.system) {
      return true;
    }

    if (!isModuleEnabled(item.moduleId, organizationContext.activeOrganization)) {
      return false;
    }

    return canRoleAccessModule({
      moduleId: item.moduleId,
      role: organizationContext.activeMembership.role,
      organization: organizationContext.activeOrganization,
      permissionRows: modulePermissionRows,
    });
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-5">
        <BrandLockup size="sm" onClick={onNavigate} />
        <div className="mt-4 flex items-center gap-3">
          <OrganizationAvatar
            name={organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name}
            avatarUrl={organizationContext.activeOrganization.logoUrl ?? organizationContext.activeOrganization.avatarUrl}
            className="h-9 w-9"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name}</p>
            <p className="text-xs text-muted-foreground">Personal workspace</p>
          </div>
        </div>
        <OrganizationSwitcher context={organizationContext} />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/app/my-pages" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "text-white shadow-sm dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
              )}
              style={active ? { backgroundColor: organizationContext.activeOrganization.accentColor ?? "#111827" } : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.title === "Messages" && unreadMessagesCount > 0 ? (
                <span className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
                  active ? "bg-white/20 text-current dark:bg-zinc-950/15" : "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
                )}>
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function getInitials(email: string) {
  const clean = email.trim();

  if (!clean) {
    return "HA";
  }

  const [name] = clean.split("@");
  const parts = name.split(/[._-]/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
