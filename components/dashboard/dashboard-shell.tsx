"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Loader2, LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { BrandLockup } from "@/components/ui/brand";
import { createClient } from "@/lib/supabase/client";
import { organizations } from "@/lib/organizations";
import { dashboardNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initials = getInitials(userEmail);

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
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-white/90 backdrop-blur-xl dark:bg-zinc-950/90 lg:flex lg:flex-col">
        <Sidebar pathname={pathname} />
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
            <Sidebar pathname={pathname} onNavigate={() => setMobileOpen(false)} />
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

          <div className="hidden h-10 flex-1 max-w-lg items-center gap-2 rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-500 dark:bg-zinc-900 sm:flex">
            <Search className="h-4 w-4" />
            <span>Search organizations, modules, members</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative rounded-xl border bg-white p-2 shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            </button>
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
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-5">
        <div>
          <BrandLockup size="sm" onClick={onNavigate} />
          <p className="mt-2 text-xs text-muted-foreground">Core workspace</p>
        </div>

        <button className="mt-5 flex w-full items-center justify-between rounded-xl border bg-zinc-50 px-3 py-2.5 text-left shadow-sm transition hover:bg-white dark:bg-zinc-900 dark:hover:bg-zinc-900/70">
          <div>
            <p className="text-sm font-medium">{organizations[0].name}</p>
            <p className="text-xs text-muted-foreground">{organizations[0].plan} plan</p>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {dashboardNavItems.map((item) => {
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
                  ? "bg-zinc-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
          <p className="text-sm font-medium">Security ready</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Roles, permissions, and organization scope are typed for future backend wiring.
          </p>
        </div>
      </div>
    </div>
  );
}
