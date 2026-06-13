import type { OrganizationRole } from "@/types/database";

export function hasAdminAccess(role: OrganizationRole) {
  return role === "owner" || role === "admin" || role === "manager";
}

export function getHomePathForRole(role: OrganizationRole) {
  return hasAdminAccess(role) ? "/dashboard" : "/app/my-pages";
}
