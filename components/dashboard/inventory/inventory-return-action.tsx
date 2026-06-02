"use client";

import { returnInventoryItemAction } from "@/app/dashboard/modules/inventory/actions";
import { Button } from "@/components/ui/button";

export function InventoryReturnAction({
  itemId,
  label = "Return",
  className,
}: {
  itemId: string;
  label?: string;
  className?: string;
}) {
  return (
    <form action={returnInventoryItemAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <Button
        type="submit"
        variant="secondary"
        className={className}
        onClick={(event) => {
          if (!window.confirm("Return this item and close the active loan?")) {
            event.preventDefault();
          }
        }}
      >
        {label}
      </Button>
    </form>
  );
}
