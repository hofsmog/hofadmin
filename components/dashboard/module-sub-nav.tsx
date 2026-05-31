"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ModuleSubNavItem = {
  title: string;
  href: string;
};

export function ModuleSubNav({ items }: { items: ModuleSubNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto rounded-xl border bg-white p-1 shadow-sm dark:bg-zinc-950">
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
