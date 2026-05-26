import type { Permission, Role } from "@/types";

export const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    "organization:read",
    "organization:update",
    "team:manage",
    "modules:manage",
    "billing:manage",
    "audit:read",
  ],
  admin: [
    "organization:read",
    "organization:update",
    "team:manage",
    "modules:manage",
    "audit:read",
  ],
  member: ["organization:read"],
  viewer: ["organization:read", "audit:read"],
};
