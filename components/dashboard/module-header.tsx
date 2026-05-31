import { ModuleSubNav, type ModuleSubNavItem } from "@/components/dashboard/module-sub-nav";
import { ButtonLink } from "@/components/ui/button";

export function ModuleHeader({
  title,
  description,
  items,
  action,
}: {
  title: string;
  description: string;
  items: ModuleSubNavItem[];
  action?: {
    href: string;
    label: string;
  };
}) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? (
          <ButtonLink href={action.href} className="shrink-0">
            {action.label}
          </ButtonLink>
        ) : null}
      </div>
      <ModuleSubNav items={items} />
    </div>
  );
}
