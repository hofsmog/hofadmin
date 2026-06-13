import { NextResponse, type NextRequest } from "next/server";
import { getHomePathForRole } from "@/lib/auth/role-destinations";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationRole } from "@/types/database";

const activeOrganizationCookie = "hofadmin_active_organization_id";

type InvitationContext = {
  invited_email: string;
  invited_name: string | null;
  invited_role: OrganizationRole;
  invitation_status: "pending" | "accepted" | "revoked";
  expires_at: string | null;
  invitation_expired: boolean;
};

type InvitationRpcClient = {
  rpc(
    fn: "get_organization_invitation_acceptance_context",
    args: { p_invitation_id: string },
  ): Promise<{ data: InvitationContext[] | null; error: { message: string } | null }>;
  rpc(
    fn: "accept_organization_invitation",
    args: { p_invitation_id: string },
  ): Promise<{ data: string | null; error: { message: string } | null }>;
  rpc(
    fn: "get_organization_invitation_by_token",
    args: { p_token: string },
  ): Promise<{ data: InvitationContext[] | null; error: { message: string } | null }>;
  rpc(
    fn: "accept_organization_invitation_by_token",
    args: { p_token: string },
  ): Promise<{ data: string | null; error: { message: string } | null }>;
  rpc(
    fn: "ensure_organization_member_profile",
    args: { p_organization_id: string; p_user_id: string; p_created_by?: string | null; p_member_name?: string | null },
  ): Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const invitationId = url.searchParams.get("invitation");
  const invitationToken = url.searchParams.get("token");

  if (!invitationId && !invitationToken) {
    console.warn("[invitations/complete] Missing invitation identifier.");
    return NextResponse.redirect(new URL("/invitations/result?status=error&reason=missing", request.url));
  }

  const supabase = await createClient();

  if (!supabase) {
    console.error("[invitations/complete] Supabase is not configured.");
    return NextResponse.redirect(new URL("/invitations/result?status=error&reason=config", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.info("[invitations/complete] User is not signed in; returning to invitation entry.", {
      invitationId: invitationId ?? null,
      hasToken: Boolean(invitationToken),
    });
    const destination = invitationToken
      ? `/invite/${encodeURIComponent(invitationToken)}`
      : `/invitations/accept?invitation=${encodeURIComponent(invitationId ?? "")}`;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const rpc = supabase as unknown as InvitationRpcClient;
  const { data: contextRows, error: contextError } = invitationToken
    ? await rpc.rpc("get_organization_invitation_by_token", { p_token: invitationToken })
    : await rpc.rpc("get_organization_invitation_acceptance_context", { p_invitation_id: invitationId ?? "" });
  const invitation = contextRows?.[0] ?? null;

  if (contextError || !invitation) {
    console.error("[invitations/complete] Invitation context lookup failed.", {
      userId: user.id,
      invitationId: invitationId ?? null,
      hasToken: Boolean(invitationToken),
      error: contextError?.message,
    });
    return NextResponse.redirect(new URL("/invitations/result?status=error&reason=not-found", request.url));
  }

  if (invitation.invitation_status !== "pending") {
    console.warn("[invitations/complete] Invitation is not pending.", {
      userId: user.id,
      invitedEmail: invitation.invited_email,
      status: invitation.invitation_status,
    });
    return NextResponse.redirect(new URL("/invitations/result?status=error&reason=not-pending", request.url));
  }

  if (invitation.invitation_expired) {
    console.warn("[invitations/complete] Invitation is expired.", {
      userId: user.id,
      invitedEmail: invitation.invited_email,
      expiresAt: invitation.expires_at,
    });
    return NextResponse.redirect(new URL("/invitations/result?status=error&reason=expired", request.url));
  }

  if ((user.email ?? "").toLowerCase() !== invitation.invited_email.toLowerCase()) {
    console.warn("[invitations/complete] Signed-in email does not match invitation.", {
      userId: user.id,
      signedInEmail: user.email,
      invitedEmail: invitation.invited_email,
    });
    const reason = encodeURIComponent(`This invitation was sent to ${invitation.invited_email}. Please sign in or register with that email address.`);
    return NextResponse.redirect(new URL(`/invitations/result?status=error&reason=${reason}`, request.url));
  }

  const { data: organizationId, error } = invitationToken
    ? await rpc.rpc("accept_organization_invitation_by_token", { p_token: invitationToken })
    : await rpc.rpc("accept_organization_invitation", { p_invitation_id: invitationId ?? "" });

  if (error || !organizationId) {
    console.error("[invitations/complete] Invitation acceptance failed.", {
      userId: user.id,
      invitedEmail: invitation.invited_email,
      invitationId: invitationId ?? null,
      hasToken: Boolean(invitationToken),
      error: error?.message,
    });
    const reason = encodeURIComponent(error?.message ?? "The invitation could not be accepted.");
    return NextResponse.redirect(new URL(`/invitations/result?status=error&reason=${reason}`, request.url));
  }

  console.info("[invitations/complete] Invitation accepted.", {
    userId: user.id,
    organizationId,
    invitationId: invitationId ?? null,
    hasToken: Boolean(invitationToken),
  });

  const verification = await verifyAcceptedInvitationState({
    supabase,
    rpc,
    organizationId,
    userId: user.id,
    userEmail: user.email ?? null,
    invitedName: "invited_name" in invitation ? invitation.invited_name ?? null : null,
  });

  if (!verification.ok) {
    const reason = encodeURIComponent(verification.reason);
    return NextResponse.redirect(new URL(`/invitations/result?status=error&reason=${reason}`, request.url));
  }

  const response = NextResponse.redirect(new URL(getHomePathForRole(invitation.invited_role), request.url));
  response.cookies.set(activeOrganizationCookie, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

async function verifyAcceptedInvitationState({
  supabase,
  rpc,
  organizationId,
  userId,
  userEmail,
  invitedName,
}: {
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
  rpc: InvitationRpcClient;
  organizationId: string;
  userId: string;
  userEmail: string | null;
  invitedName: string | null;
}) {
  const [{ data: membership, error: membershipError }, { data: memberProfile, error: memberProfileError }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, user_id, role, invited_by, joined_at")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle(),
    userEmail
      ? supabase
          .from("members")
          .select("id, organization_id, name, email, created_at")
          .eq("organization_id", organizationId)
          .eq("email", userEmail.toLowerCase())
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  console.info("[invitations/complete] Acceptance verification.", {
    organizationId,
    userId,
    userEmail,
    hasOrganizationMembership: Boolean(membership),
    hasMemberProfile: Boolean(memberProfile),
    membershipError: membershipError?.message ?? null,
    memberProfileError: memberProfileError?.message ?? null,
  });

  if (membershipError || !membership) {
    console.error("[invitations/complete] Organization membership missing after invitation acceptance.", {
      organizationId,
      userId,
      error: membershipError?.message ?? null,
    });
    return { ok: false, reason: "Organization membership was not created." };
  }

  if (memberProfileError) {
    console.error("[invitations/complete] Member profile lookup failed after invitation acceptance.", {
      organizationId,
      userId,
      userEmail,
      error: memberProfileError.message,
    });
    return { ok: false, reason: "Member profile lookup failed after invitation acceptance." };
  }

  if (memberProfile) {
    return { ok: true, reason: "" };
  }

  const { data: ensuredMemberId, error: ensureError } = await rpc.rpc("ensure_organization_member_profile", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_created_by: membership.invited_by ?? null,
    p_member_name: invitedName,
  });

  if (ensureError || !ensuredMemberId) {
    console.error("[invitations/complete] Member profile sync failed after invitation acceptance.", {
      organizationId,
      userId,
      userEmail,
      error: ensureError?.message ?? null,
    });
    return { ok: false, reason: "Member profile could not be created after invitation acceptance." };
  }

  console.info("[invitations/complete] Member profile synced after invitation acceptance.", {
    organizationId,
    userId,
    userEmail,
    memberId: ensuredMemberId,
  });

  return { ok: true, reason: "" };
}
