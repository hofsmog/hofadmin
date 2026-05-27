"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  Package,
  QrCode,
  ScanLine,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ModuleDefinition, ModuleIconKey } from "@/types";

const icons: Record<ModuleIconKey, ComponentType<{ className?: string }>> = {
  qr: QrCode,
  forms: ClipboardList,
  bookings: CalendarCheck,
  inventory: Package,
  members: UsersRound,
  checkIns: ScanLine,
};

export function ModuleCard({ module }: { module: ModuleDefinition }) {
  const [enabled, setEnabled] = useState(module.status === "enabled");
  const Icon = icons[module.icon];

  return (
    <Card className="group transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/[0.06] dark:hover:shadow-black/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl border bg-zinc-50 text-zinc-800 transition group-hover:bg-white dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:bg-zinc-900/70">
            <Icon className="h-5 w-5" />
          </div>
          <Switch
            checked={enabled}
            aria-label={`${enabled ? "Disable" : "Enable"} ${module.name}`}
            onClick={() => setEnabled((value) => !value)}
          />
        </div>
        <div className="pt-2">
          <CardTitle>{module.name}</CardTitle>
          <CardDescription>{module.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Badge>{module.category}</Badge>
        {module.href && enabled ? (
          <Link
            href={module.href}
            className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            Open module
          </Link>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {enabled ? "Enabled" : "Disabled"}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
