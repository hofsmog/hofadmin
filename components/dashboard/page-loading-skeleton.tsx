import { Card } from "@/components/ui/card";

export function PageLoadingSkeleton({
  stats = 3,
  rows = 5,
  sidePanel = false,
}: {
  stats?: number;
  rows?: number;
  sidePanel?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="h-7 w-56 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: stats }).map((_, index) => (
          <Card key={index} className="relative h-28 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <div className="skeleton-shimmer absolute inset-0" />
          </Card>
        ))}
      </div>

      <div className={sidePanel ? "grid gap-4 lg:grid-cols-[1fr_22rem]" : "grid gap-4"}>
        <Card className="overflow-hidden p-5">
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <div className="h-4 w-2/5 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </Card>
        {sidePanel ? (
          <Card className="relative min-h-72 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <div className="skeleton-shimmer absolute inset-0" />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
