import { NextResponse, type NextRequest } from "next/server";
import { getHomePathForRole, hasAdminAccess } from "@/lib/auth/role-destinations";
import { getSafeAuthNextPath } from "@/lib/auth/auth-redirects";
import { getOrganizationContext } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedPath = getSafeAuthNextPath(url.searchParams.get("redirectTo") || "/dashboard");
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=supabase_not_configured", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(requestedPath)}`, request.url));
  }

  const organizationContext = await getOrganizationContext(supabase, user);
  const role = organizationContext.activeMembership.role;

  if (hasAdminAccess(role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(new URL(getMemberDestination(requestedPath, role), request.url));
}

function getMemberDestination(requestedPath: string, role: Parameters<typeof getHomePathForRole>[0]) {
  if (requestedPath.startsWith("/app/")) {
    return requestedPath;
  }

  return getHomePathForRole(role);
}
