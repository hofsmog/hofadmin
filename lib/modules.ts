import type { ModuleDefinition } from "@/types";

export const modules: ModuleDefinition[] = [
  {
    id: "qr-checkins",
    name: "QR + Check-ins",
    description: "Generate QR access points and register organization-scoped check-ins.",
    category: "Operations",
    status: "enabled",
    icon: "qr",
    href: "/dashboard/modules/qr-checkins",
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
];
