"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { BrandLockup } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot";

const defaultError = "Something went wrong. Please try again.";

export function AuthCard({
  title,
  description,
  mode,
}: {
  title: string;
  description: string;
  mode: AuthMode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
  const urlError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    urlError === "supabase_not_configured"
      ? "Supabase is not configured for this environment."
      : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitLabel = useMemo(() => {
    if (isLoading) {
      return mode === "forgot" ? "Sending reset link" : mode === "signup" ? "Creating account" : "Logging in";
    }

    return mode === "login" ? "Login" : mode === "signup" ? "Create account" : "Send reset link";
  }, [isLoading, mode]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const organizationName = String(formData.get("organizationName") || "").trim();

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        router.replace(redirectTo);
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              organization_name: organizationName,
            },
            emailRedirectTo,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          if (!isInvitationRedirect(redirectTo)) {
            const bootstrapResponse = await fetch("/auth/bootstrap-organization", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ organizationName }),
            });

            if (!bootstrapResponse.ok) {
              setError("Account created, but the organization could not be prepared. Please try logging in.");
              return;
            }
          }

          router.replace(redirectTo);
          router.refresh();
          return;
        }

        setMessage("Check your email to confirm your account, then return to HofAdmin.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/dashboard/settings`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("Password reset email sent. Check your inbox for the secure link.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : defaultError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-6 shadow-xl shadow-zinc-950/[0.06]">
      <div className="mb-6">
        <BrandLockup className="mb-6" />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Organization name</span>
            <Input name="organizationName" placeholder="Hof North" required />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <Input name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
        </label>

        {mode !== "forgot" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <Input
              name="password"
              type="password"
              placeholder="********"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>
        ) : null}

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

        <Button className="h-11 w-full" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password" className="text-muted-foreground transition hover:text-foreground">
              Forgot password?
            </Link>
            <Link href="/signup" className="font-medium">
              Sign up
            </Link>
          </>
        ) : (
          <Link href="/login" className="font-medium">
            Back to login
          </Link>
        )}
      </div>
    </Card>
  );
}

export function AuthCardLoading() {
  return (
    <Card className="w-full max-w-md p-6 shadow-xl shadow-zinc-950/[0.06]">
      <div className="h-10 w-40 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 h-7 w-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 space-y-4">
        <div className="h-11 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-11 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-11 animate-pulse rounded-xl bg-zinc-300 dark:bg-zinc-700" />
      </div>
    </Card>
  );
}

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function isInvitationRedirect(value: string) {
  return value.startsWith("/invitations/accept");
}
