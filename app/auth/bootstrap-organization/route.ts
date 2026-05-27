import { NextResponse, type NextRequest } from "next/server";
import { createOrganizationForUser } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { organizationName } = (await request.json().catch(() => ({}))) as {
    organizationName?: string;
  };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    const metadataName = user.user_metadata?.organization_name;
    const name =
      organizationName ||
      (typeof metadataName === "string" && metadataName.trim()
        ? metadataName
        : `${user.email?.split("@")[0] ?? "HofAdmin"} Workspace`);
    await createOrganizationForUser(supabase, user, name);
  }

  return NextResponse.json({ ok: true });
}
