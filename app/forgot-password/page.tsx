import { AuthCard } from "@/components/auth/auth-card";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <AuthCard
        mode="forgot"
        title="Reset password"
        description="Enter your account email and HofAdmin will prepare a secure reset flow when auth is connected."
      />
    </main>
  );
}
