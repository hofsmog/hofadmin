import { BrandLockup } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

export function BrandShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950", className)}>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <BrandLockup size="md" />
        </div>
        {children}
      </div>
    </main>
  );
}
