"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

type TeamMember = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  joined_at: string;
};

type TeamMemberRpcClient = {
  rpc(
    fn: "list_organization_team_members",
    args: { p_organization_id: string },
  ): Promise<{ data: TeamMember[] | null; error: { message: string } | null }>;
};

export async function createCalendarEventAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const role = organizationContext.activeMembership.role;

  if (role !== "owner" && role !== "admin") {
    return;
  }

  const organizationId = organizationContext.activeOrganization.id;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startAtValue = String(formData.get("startAt") || "");
  const endAtValue = String(formData.get("endAt") || "");
  const visibility = String(formData.get("visibility") || "assigned") === "organization" ? "organization" : "assigned";
  const assignedTo = String(formData.get("assignedTo") || "").trim() || null;

  if (!title || !startAtValue) {
    return;
  }

  const startAt = toIsoDate(startAtValue);
  const endAt = endAtValue ? toIsoDate(endAtValue) : null;

  if (!startAt || (endAtValue && !endAt)) {
    console.error("[calendar] Invalid date values for calendar event", {
      organizationId,
      userId: user.id,
      startAtValue,
      endAtValue,
    });
    return;
  }

  if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
    console.error("[calendar] End date is before start date", {
      organizationId,
      userId: user.id,
      startAt,
      endAt,
    });
    return;
  }

  if (assignedTo) {
    const { data: teamMembers, error: teamError } = await (supabase as unknown as TeamMemberRpcClient).rpc(
      "list_organization_team_members",
      { p_organization_id: organizationId },
    );

    if (teamError || !teamMembers?.some((member) => member.user_id === assignedTo)) {
      console.error("[calendar] Assigned user is not in organization", {
        organizationId,
        userId: user.id,
        assignedTo,
        error: teamError,
      });
      return;
    }
  }

  const { error } = await supabase.from("calendar_events").insert({
    organization_id: organizationId,
    title,
    description: description || null,
    start_at: startAt,
    end_at: endAt,
    event_type: "event",
    assigned_to: assignedTo,
    created_by: user.id,
    visibility,
  });

  if (error) {
    console.error("[calendar] Could not create calendar event", {
      organizationId,
      userId: user.id,
      error,
    });
    return;
  }

  revalidatePath("/app/calendar");
  revalidatePath("/app/my-pages");
}

function toIsoDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
