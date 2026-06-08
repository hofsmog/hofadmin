"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { canManageOrganization } from "@/lib/organizations";
import { getEffectiveModuleLimit } from "@/lib/plans";
import { getSelectableEnabledModuleIds, modules, systemModuleIds } from "@/lib/modules";

export async function openModuleAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const moduleId = String(formData.get("moduleId") || "");
  const targetModule = modules.find((item) => item.id === moduleId && item.href);

  if (!targetModule?.href) {
    throw new Error("Module is not available yet.");
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: "module_opened",
    title: "Module opened",
    description: `${targetModule.name} was opened.`,
    actorId: user.id,
    metadata: { moduleId: targetModule.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/modules");
  redirect(targetModule.href);
}

export async function toggleModuleAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const moduleId = String(formData.get("moduleId") || "");
  const shouldEnable = String(formData.get("enabled") || "") === "true";
  const targetModule = modules.find((item) => item.id === moduleId);

  if (!targetModule || systemModuleIds.includes(moduleId as (typeof systemModuleIds)[number])) {
    redirect("/dashboard/modules?error=module");
  }

  if (!canManageOrganization(organizationContext.activeMembership.role)) {
    redirect("/dashboard/modules?error=permission");
  }

  const currentEnabled = getSelectableEnabledModuleIds(organizationContext.activeOrganization);
  const moduleLimit = getEffectiveModuleLimit(organizationContext.activeOrganization);
  const isAlreadyEnabled = currentEnabled.includes(moduleId);

  if (shouldEnable && !isAlreadyEnabled && moduleLimit !== null && currentEnabled.length >= moduleLimit) {
    redirect("/dashboard/modules?error=limit");
  }

  const nextEnabled = shouldEnable
    ? Array.from(new Set([...currentEnabled, moduleId]))
    : currentEnabled.filter((id) => id !== moduleId);

  const { error } = await supabase
    .from("organizations")
    .update({ enabled_modules: nextEnabled, starter_modules: nextEnabled, updated_at: new Date().toISOString() })
    .eq("id", organizationContext.activeOrganization.id);

  if (error) {
    redirect("/dashboard/modules?error=save");
  }

  await recordActivityEvent({
    supabase,
    organizationId: organizationContext.activeOrganization.id,
    type: shouldEnable ? "module_enabled" : "module_opened",
    title: shouldEnable ? "Module enabled" : "Module disabled",
    description: `${targetModule.name} was ${shouldEnable ? "enabled" : "disabled"}.`,
    actorId: user.id,
    metadata: { moduleId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/modules");
  redirect("/dashboard/modules?updated=1");
}
