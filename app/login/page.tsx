import { Suspense } from "react";
import { AuthCard, AuthCardLoading } from "@/components/auth/auth-card";
import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <Suspense fallback={<AuthCardLoading />}>
        <AuthCard
          mode="login"
          title="Welcome back"
          description="Login to manage organizations, modules, teams, billing, and audit visibility."
        />
      </Suspense>
    </main>
  );
}
