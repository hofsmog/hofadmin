import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <AuthCard
        mode="login"
        title="Welcome back"
        description="Login to manage organizations, modules, teams, billing, and audit visibility."
      />
    </main>
  );
}
