import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-28 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-8 w-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-32 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
