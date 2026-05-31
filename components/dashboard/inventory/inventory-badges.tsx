import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryItemCondition, InventoryItemStatus } from "@/types/database";

export const inventoryStatusLabels: Record<InventoryItemStatus, string> = {
  available: "Available",
  in_use: "In use",
  maintenance: "Maintenance",
  lost: "Lost",
  retired: "Retired",
};

export const inventoryConditionLabels: Record<InventoryItemCondition, string> = {
  new: "New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  broken: "Broken",
};

const statusClassNames: Record<InventoryItemStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  in_use: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  maintenance: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  lost: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  retired: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
};

export function InventoryStatusBadge({ status }: { status: InventoryItemStatus }) {
  return <Badge className={cn(statusClassNames[status])}>{inventoryStatusLabels[status]}</Badge>;
}

export function InventoryConditionBadge({ condition }: { condition: InventoryItemCondition }) {
  return <Badge>{inventoryConditionLabels[condition]}</Badge>;
}
