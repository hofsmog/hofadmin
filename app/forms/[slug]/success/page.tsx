import { CheckCircle2 } from "lucide-react";
import { BrandLockup } from "@/components/ui/brand";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicFormSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <BrandLockup size="sm" />
        </div>
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle>Thank you for your submission.</CardTitle>
            <CardDescription>Your response has been saved.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
