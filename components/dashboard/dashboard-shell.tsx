"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Loader2, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLockup } from "@/components/ui/brand";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { MessagesAutoRefresh } from "@/components/dashboard/messages-auto-refresh";
import { createClient } from "@/lib/supabase/client";
import { getDashboardNavItems } from "@/lib/navigation";
import type { ModulePermissionRow } from "@/lib/module-permissions";
import { cn } from "@/lib/utils";
import type { OrganizationContext } from "@/types";

export function DashboardShell({
  children,
  userId,
  userEmail,
  organizationContext,
  modulePermissionRows = [],
}: {
  children: React.ReactNode;
  userId: string;
  userEmail: string;
  organizationContext: OrganizationContext;
  modulePermissionRows?: ModulePermissionRow[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initials = getInitials(userEmail);
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
        <Sidebar pathname={pathname} organizationContext={organizationContext} modulePermissionRows={modulePermissionRows} />
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
            <Sidebar
              pathname={pathname}
              organizationContext={organizationContext}
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

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 shadow-sm dark:bg-zinc-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-950 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                {initials}
              </span>
              <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{userEmail}</span>
              <ChevronDown className="hidden h-4 w-4 text-zinc-500 sm:block" />
            </div>
            <button
              type="button"
              aria-label="Logout"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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

function Sidebar({
  pathname,
  organizationContext,
  modulePermissionRows,
  onNavigate,
}: {
  pathname: string;
  organizationContext: OrganizationContext;
  modulePermissionRows: ModulePermissionRow[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-5">
        <div>
          <BrandLockup size="sm" onClick={onNavigate} />
        </div>

        <OrganizationSwitcher context={organizationContext} />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {getDashboardNavItems(organizationContext.activeOrganization, {
          role: organizationContext.activeMembership.role,
          permissionRows: modulePermissionRows,
        }).map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
