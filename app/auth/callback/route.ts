import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthNextPath } from "@/lib/auth/auth-redirects";
import { hasAdminAccess } from "@/lib/auth/role-destinations";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationForUser } from "@/lib/organizations";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = getSafeAuthNextPath(requestUrl.searchParams.get("next") || "/onboarding");

  if (!code) {
    console.warn("[auth/callback] Missing auth code.", {
      next,
      origin: requestUrl.origin,
    });
  }

  if (code) {
    const supabase = await createClient();

    if (!supabase) {
      console.error("[auth/callback] Supabase is not configured.", { next });
      return NextResponse.redirect(new URL("/login?error=supabase_not_configured", request.url));
    }

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[auth/callback] Code exchange failed.", {
        next,
        error: exchangeError.message,
      });
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("verification_failed")}`, request.url));
    }

    if (data?.user && !isInvitationRedirect(next) && !isOrganizationRegisterRedirect(next)) {
      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        console.error("[auth/callback] Membership lookup failed after verification.", {
          userId: data.user.id,
          error: membershipError.message,
        });
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("membership_lookup_failed")}`, request.url));
      }

      if (!membership) {
        const metadataName = data.user.user_metadata?.organization_name;
        const organizationName =
          typeof metadataName === "string" && metadataName.trim()
            ? metadataName
            : `${data.user.email?.split("@")[0] ?? "HofAdmin"} Workspace`;
        console.info("[auth/callback] Creating initial organization after verification.", {
          userId: data.user.id,
          next,
        });
        try {
          await createOrganizationForUser(supabase, data.user, organizationName);
        } catch (error) {
          console.error("[auth/callback] Initial organization creation failed.", {
            userId: data.user.id,
            error: error instanceof Error ? error.message : error,
          });
          return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("organization_bootstrap_failed")}`, request.url));
        }
        if (!isOrganizationRegisterRedirect(next) && !isInvitationRedirect(next)) {
          next = "/onboarding";
        }
      } else if (hasAdminAccess(membership.role) && !isOrganizationRegisterRedirect(next) && !isInvitationRedirect(next)) {
        next = "/dashboard";
      }
    } else if (data?.user && isInvitationRedirect(next)) {
      console.info("[auth/callback] Verified invited user; redirecting to invitation acceptance.", {
        userId: data.user.id,
        next,
      });
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
