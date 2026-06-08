"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FormsSubmissionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[forms/submissions] Route crashed", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Forms responses could not load</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          We could not load form responses right now. Try again or check your connection.
        </p>
        <Button type="button" className="mt-5" onClick={reset}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
