import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InvitationResultPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; reason?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const success = params.status === "success";
  const reason = getReason(params.reason);
  const Icon = success ? CheckCircle2 : XCircle;

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className={success ? "text-emerald-600" : "text-red-600"}>
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle>{success ? "You have joined the organization" : "Invitation could not be accepted"}</CardTitle>
          <CardDescription>{success ? "Your HofAdmin access is ready." : reason}</CardDescription>
          <div className="pt-3">
            {success ? (
              <ButtonLink href="/dashboard">Open dashboard</ButtonLink>
            ) : (
              <Link href="/login" className="text-sm font-medium">Back to login</Link>
            )}
          </div>
        </CardHeader>
      </Card>
    </main>
  );
}

function getReason(value?: string) {
  if (!value || value === "missing") {
    return "Ask the organization admin to resend the invitation.";
  }

  if (value === "config") {
    return "Supabase is not configured for this environment.";
  }

  return value;
}
