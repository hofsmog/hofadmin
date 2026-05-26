import type { ModuleDefinition } from "@/types";

export const modules: ModuleDefinition[] = [
  {
    id: "qr-system",
    name: "QR System",
    description: "Issue QR flows for menus, check-ins, events, and resource access.",
    category: "Operations",
    status: "enabled",
    icon: "qr",
  },
  {
    id: "forms",
    name: "Forms",
    description: "Collect structured requests, surveys, applications, and feedback.",
    category: "Workspace",
    status: "enabled",
    icon: "forms",
  },
  {
    id: "bookings",
    name: "Bookings",
    description: "Coordinate reservations, rooms, services, appointments, and events.",
    category: "Engagement",
    status: "disabled",
    icon: "bookings",
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Track stock, assets, equipment, and organization resources.",
    category: "Commerce",
    status: "disabled",
    icon: "inventory",
  },
  {
    id: "members",
    name: "Members",
    description: "Manage member profiles, segments, lifecycle state, and access.",
    category: "Engagement",
    status: "enabled",
    icon: "members",
  },
  {
    id: "check-ins",
    name: "Check-ins",
    description: "Validate attendance, visits, shift presence, and secure entry points.",
    category: "Operations",
    status: "disabled",
    icon: "checkIns",
  },
];
