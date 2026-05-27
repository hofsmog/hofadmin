import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="h-5 w-56 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-2 w-80 max-w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="relative h-32 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <div className="skeleton-shimmer absolute inset-0" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative h-96 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <div className="skeleton-shimmer absolute inset-0" />
        </Card>
        <Card className="relative h-96 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <div className="skeleton-shimmer absolute inset-0" />
        </Card>
      </div>
    </div>
  );
}
