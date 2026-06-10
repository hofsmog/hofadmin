import type { SupabaseClient } from "@supabase/supabase-js";
import { isModuleEnabled } from "@/lib/modules";
import type { Database, OrganizationRole } from "@/types/database";
import type { Organization } from "@/types";

export type ModulePermissionRow = Database["public"]["Tables"]["organization_module_permissions"]["Row"];
type Supabase = SupabaseClient<Database>;

export type ModuleAccessContext = {
  rows: ModulePermissionRow[];
  role: OrganizationRole;
  userId: string;
  organization: Organization;
};

export async function getModulePermissionRows(supabase: Supabase, organizationId: string) {
  const { data, error } = await supabase
    .from("organization_module_permissions")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[module-permissions] Could not load module permissions", { organizationId, error });
    return [];
  }

  return data ?? [];
}

export function canRoleAccessModule({
  moduleId,
  role,
  organization,
  permissionRows,
}: {
  moduleId: string;
  role: OrganizationRole;
  organization: Organization;
  permissionRows: ModulePermissionRow[];
}) {
  if (role === "owner" || role === "admin") {
    return true;
  }

  if (!isModuleEnabled(moduleId, organization)) {
    return false;
  }

  const moduleRows = permissionRows.filter((row) => row.module_id === moduleId && row.group_id === null);

  if (!moduleRows.length) {
    return true;
  }

  return moduleRows.some((row) => row.role === role && row.can_access);
}

export function getAllowedModuleIds({
  organization,
  role,
  permissionRows,
}: {
  organization: Organization;
  role: OrganizationRole;
  permissionRows: ModulePermissionRow[];
}) {
  return new Set(
    organization.enabledModules.filter((moduleId) =>
      canRoleAccessModule({ moduleId, role, organization, permissionRows }),
    ),
  );
}
