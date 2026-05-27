"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { modules } from "@/lib/modules";

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
