import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrganizationAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-xl border bg-white text-sm font-semibold text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200",
        className,
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes="40px" className="object-cover" />
      ) : name ? (
        name.slice(0, 2).toUpperCase()
      ) : (
        <Building2 className="h-4 w-4" />
      )}
    </span>
  );
}
