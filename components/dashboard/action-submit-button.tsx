"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MouseEventHandler } from "react";

export function ActionSubmitButton({
  children,
  pendingLabel = "Saving",
  className,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className={className} onClick={onClick}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
