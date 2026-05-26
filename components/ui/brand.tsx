import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandSize = "sm" | "md";

const sizes = {
  sm: {
    link: "gap-2.5",
    mark: "h-8 w-8",
    text: "text-sm",
  },
  md: {
    link: "gap-3",
    mark: "h-10 w-10",
    text: "text-sm",
  },
};

export function BrandLockup({
  href = "/",
  size = "md",
  className,
  onClick,
}: {
  href?: string;
  size?: BrandSize;
  className?: string;
  onClick?: () => void;
}) {
  const current = sizes[size];

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center rounded-xl transition-opacity hover:opacity-80",
        current.link,
        className,
      )}
    >
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 dark:bg-white dark:ring-white/10",
          current.mark,
        )}
      >
        <Image
          src="/logo-hofadmin.png"
          alt=""
          fill
          sizes={size === "md" ? "40px" : "32px"}
          className="object-cover"
          style={{ objectPosition: "7% center" }}
          priority
        />
      </span>
      <span
        className={cn(
          "font-semibold tracking-tight text-zinc-950 dark:text-zinc-50",
          current.text,
        )}
      >
        HofAdmin
      </span>
    </Link>
  );
}
