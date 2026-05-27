import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationForUser } from "@/lib/organizations";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data } = (await supabase?.auth.exchangeCodeForSession(code)) ?? {};

    if (supabase && data?.user) {
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
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
