import { Card } from "@/components/ui/card";

export default function MembersModuleLoading() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="h-32 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
            <Card className="h-32 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
          </div>
          <Card className="h-96 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
        </div>
        <Card className="h-96 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}
