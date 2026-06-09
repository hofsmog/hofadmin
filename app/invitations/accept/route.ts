import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const activeOrganizationCookie = "hofadmin_active_organization_id";
type InvitationRpcClient = {
  rpc(
    fn: "accept_organization_invitation",
    args: { p_invitation_id: string },
  ): Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const invitationId = requestUrl.searchParams.get("invitation");
  const redirectTo = `/invitations/accept${invitationId ? `?invitation=${encodeURIComponent(invitationId)}` : ""}`;

  if (!invitationId) {
    return NextResponse.redirect(new URL("/invitations/result?status=error&reason=missing", request.url));
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/invitations/result?status=error&reason=config", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(redirectTo)}`, request.url));
  }

  const { data: organizationId, error } = await (supabase as unknown as InvitationRpcClient).rpc("accept_organization_invitation", {
    p_invitation_id: invitationId,
  });

  if (error || !organizationId) {
    const reason = encodeURIComponent(error?.message ?? "The invitation could not be accepted.");
    return NextResponse.redirect(new URL(`/invitations/result?status=error&reason=${reason}`, request.url));
  }

  const response = NextResponse.redirect(new URL("/invitations/result?status=success", request.url));
  response.cookies.set(activeOrganizationCookie, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
