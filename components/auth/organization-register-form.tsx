"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { BrandLockup } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthCallbackUrl } from "@/lib/auth/auth-redirects";
import { createClient } from "@/lib/supabase/client";

export function OrganizationRegisterForm({
  organizationName,
  orgSlug,
}: {
  organizationName: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const completePath = `/${orgSlug}/register/complete`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            registration_organization_slug: orgSlug,
          },
          emailRedirectTo: getAuthCallbackUrl(completePath, origin),
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.replace(completePath);
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account. The link will bring you back to HofAdmin.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-6 shadow-xl shadow-zinc-950/[0.06]">
      <BrandLockup className="mb-6" />
      <h1 className="text-2xl font-semibold tracking-tight">Join {organizationName}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Create your HofAdmin account to access the pages and tools this organization has enabled for you.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Name</span>
          <Input name="fullName" placeholder="Your name" autoComplete="name" required />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <Input name="password" type="password" placeholder="********" autoComplete="new-password" minLength={6} required />
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
        <Button className="h-11 w-full" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {isLoading ? "Creating account" : "Create account"}
        </Button>
      </form>
      <div className="mt-6 text-sm">
        <Link href={`/login?redirectTo=${encodeURIComponent(completePath)}`} className="font-medium">
          Already have an account? Sign in
        </Link>
      </div>
    </Card>
  );
}
