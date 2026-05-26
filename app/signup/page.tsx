import { AuthCard } from "@/components/auth/auth-card";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <AuthCard
        mode="signup"
        title="Create your workspace"
        description="Start with a clean organization shell. Backend authentication will be wired in the next phase."
      />
    </main>
  );
}
