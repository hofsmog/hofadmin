"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function InvitationMismatchPanel({
  invitedEmail,
  signedInEmail,
  organizationName,
}: {
  invitedEmail: string;
  signedInEmail: string;
  organizationName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitation") ?? "";

  async function signOutAndContinue() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/invitations/accept?invitation=${encodeURIComponent(invitationId)}`);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email does not match this invitation</CardTitle>
          <CardDescription>
            This invitation to join {organizationName} was sent to {invitedEmail}. You are currently signed in as {signedInEmail}.
            Please sign in or register with {invitedEmail}.
          </CardDescription>
          <div className="pt-3">
            <Button type="button" onClick={signOutAndContinue}>
              <LogOut className="h-4 w-4" />
              Sign out and continue
            </Button>
          </div>
        </CardHeader>
      </Card>
    </main>
  );
}
