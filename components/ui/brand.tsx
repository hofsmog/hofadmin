import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandSize = "sm" | "md";

const sizes = {
  sm: {
    link: "h-9 px-1",
    imageClass: "h-7 w-auto",
    width: 117,
    height: 28,
    sizes: "117px",
  },
  md: {
    link: "h-11 px-1.5",
    imageClass: "h-9 w-auto sm:h-10",
    width: 167,
    height: 40,
    sizes: "(max-width: 640px) 151px, 167px",
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
        "group inline-flex shrink-0 items-center rounded-xl transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-950/[0.03] dark:bg-white/[0.98] dark:hover:bg-white",
        current.link,
        className,
      )}
    >
      <Image
        src="/logo-hofadmin.png"
        alt="HofAdmin"
        width={current.width}
        height={current.height}
        sizes={current.sizes}
        className={cn("object-contain", current.imageClass)}
        priority
      />
    </Link>
  );
}
