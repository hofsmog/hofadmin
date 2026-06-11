import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { BrandLockup } from "@/components/ui/brand";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, organizationContext } = await requireOrganizationContext();

  if (organizationContext.activeOrganization.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-4xl">
        <BrandLockup size="sm" />
      </div>
      <OnboardingForm
        defaultOrganizationName={organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name}
        userEmail={user.email ?? "Workspace owner"}
        userRole={organizationContext.activeMembership.role}
      />
    </main>
  );
}
