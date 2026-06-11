import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthNextPath } from "@/lib/auth/auth-redirects";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationForUser } from "@/lib/organizations";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = getSafeAuthNextPath(requestUrl.searchParams.get("next") || "/onboarding");

  if (code) {
    const supabase = await createClient();
    const { data } = (await supabase?.auth.exchangeCodeForSession(code)) ?? {};

    if (supabase && data?.user && !isInvitationRedirect(next) && !isOrganizationRegisterRedirect(next)) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (!membership) {
        const metadataName = data.user.user_metadata?.organization_name;
        const organizationName =
          typeof metadataName === "string" && metadataName.trim()
            ? metadataName
            : `${data.user.email?.split("@")[0] ?? "HofAdmin"} Workspace`;
        await createOrganizationForUser(supabase, data.user, organizationName);
        if (!isOrganizationRegisterRedirect(next) && !isInvitationRedirect(next)) {
          next = "/onboarding";
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

function isOrganizationRegisterRedirect(value: string) {
  return /^\/[^/]+\/register\/complete$/.test(value);
}

function isInvitationRedirect(value: string) {
  return value.startsWith("/invitations/accept") || value.startsWith("/invite/");
}
