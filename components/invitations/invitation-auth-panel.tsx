"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type InvitationAuthMode = "signup" | "login";

export function InvitationAuthPanel({
  invitationId,
  organizationName,
  invitedEmail,
}: {
  invitationId: string;
  organizationName: string;
  invitedEmail: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<InvitationAuthMode>("signup");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const acceptPath = `/invitations/accept?invitation=${encodeURIComponent(invitationId)}`;

  const submitLabel = useMemo(() => {
    if (pending) {
      return mode === "signup" ? "Creating account" : "Signing in";
    }

    return mode === "signup" ? "Create account" : "Sign in";
  }, [mode, pending]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invitedEmail,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        router.replace(acceptPath);
        router.refresh();
        return;
      }

      const origin = window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: invitedEmail,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(acceptPath)}`,
          data: {
            invitation_id: invitationId,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.replace(acceptPath);
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account, then return to this invitation link.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Invitation sign in failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <Card className="w-full max-w-md p-6 shadow-xl shadow-zinc-950/[0.06]">
        <BrandLockup className="mb-6" />
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;ve been invited to join {organizationName}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Create an account or sign in with <span className="font-medium text-foreground">{invitedEmail}</span> to continue.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={mode === "signup" ? "rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm dark:bg-zinc-950" : "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={mode === "login" ? "rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm dark:bg-zinc-950" : "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"}
          >
            Sign in
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input value={invitedEmail} readOnly type="email" autoComplete="email" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300">
              {message}
            </div>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </form>
      </Card>
    </main>
  );
}
