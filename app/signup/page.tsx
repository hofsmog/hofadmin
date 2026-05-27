import { Suspense } from "react";
import { AuthCard, AuthCardLoading } from "@/components/auth/auth-card";
import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <Suspense fallback={<AuthCardLoading />}>
        <AuthCard
          mode="signup"
          title="Create your workspace"
          description="Create a secure HofAdmin account and prepare your first organization workspace."
        />
      </Suspense>
    </main>
  );
}
