"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { getEffectiveModuleLimit } from "@/lib/plans";
import type { OrganizationType } from "@/types/database";

const organizationTypes = new Set<OrganizationType>([
  "school",
  "club",
  "business",
  "restaurant",
  "cafe",
  "event",
  "other",
]);

const starterModules = new Set([
  "qr-checkins",
  "members",
  "forms",
  "surveys",
  "inventory",
  "documents",
  "bookings",
]);

export type OnboardingState = {
  status: "idle" | "error";
  message: string;
};

export async function completeOnboardingAction(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationType = String(formData.get("organizationType") || "") as OrganizationType;
  const organizationName = String(formData.get("organizationName") || "").trim();
  const selectedModules = formData
    .getAll("starterModules")
    .map((value) => String(value))
    .filter((value) => starterModules.has(value));

  if (!organizationTypes.has(organizationType)) {
    return { status: "error", message: "Choose an organization type." };
  }

  if (organizationName.length < 2 || organizationName.length > 80) {
    return { status: "error", message: "Organization name must be between 2 and 80 characters." };
  }

  if (!selectedModules.length) {
    return { status: "error", message: "Choose at least one starter module." };
  }

  const moduleLimit = getEffectiveModuleLimit(organizationContext.activeOrganization);

  if (moduleLimit !== null && selectedModules.length > moduleLimit) {
    return { status: "error", message: `Your current plan includes ${moduleLimit} modules. Choose fewer modules to finish setup.` };
  }

  const checklist = {
    createFirstQrItem: false,
    addFirstMember: false,
    inviteTeamMember: false,
    customizeBranding: false,
  };

  const { error } = await supabase
    .from("organizations")
    .update({
      name: organizationName,
      display_name: organizationName,
      organization_type: organizationType,
      starter_modules: selectedModules,
      enabled_modules: selectedModules,
      onboarding_checklist: checklist,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationContext.activeOrganization.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: "organization_updated",
    title: "Onboarding completed",
    description: `${organizationName} finished initial setup.`,
    actorId: user.id,
    metadata: { organizationType, starterModules: selectedModules },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  redirect("/dashboard");
}
