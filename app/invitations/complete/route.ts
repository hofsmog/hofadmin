import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const activeOrganizationCookie = "hofadmin_active_organization_id";

type InvitationContext = {
  invited_email: string;
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

  const response = NextResponse.redirect(new URL("/app/my-pages", request.url));
  response.cookies.set(activeOrganizationCookie, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
