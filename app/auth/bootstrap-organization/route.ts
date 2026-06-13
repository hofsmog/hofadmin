import { NextResponse, type NextRequest } from "next/server";
import { createOrganizationForUser } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  if (!supabase) {
    console.error("[auth/bootstrap-organization] Supabase is not configured.");
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[auth/bootstrap-organization] Unauthorized bootstrap request.", {
      error: userError?.message,
    });
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { organizationName } = (await request.json().catch(() => ({}))) as {
    organizationName?: string;
  };

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("[auth/bootstrap-organization] Membership lookup failed.", {
      userId: user.id,
      error: membershipError.message,
    });
    return NextResponse.json({ error: "Membership lookup failed." }, { status: 500 });
  }

  if (!membership) {
    const metadataName = user.user_metadata?.organization_name;
    const name =
      organizationName ||
      (typeof metadataName === "string" && metadataName.trim()
        ? metadataName
        : `${user.email?.split("@")[0] ?? "HofAdmin"} Workspace`);
    console.info("[auth/bootstrap-organization] Creating initial organization.", {
      userId: user.id,
    });
    try {
      await createOrganizationForUser(supabase, user, name);
    } catch (error) {
      console.error("[auth/bootstrap-organization] Initial organization creation failed.", {
        userId: user.id,
        error: error instanceof Error ? error.message : error,
      });
      return NextResponse.json({ error: "Organization could not be created." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
