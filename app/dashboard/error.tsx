"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">Dashboard could not load</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Refresh the secure session and try again. If this continues, check the Supabase project configuration.
      </p>
      <Button type="button" className="mt-5" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
