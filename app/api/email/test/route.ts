import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { canManageOrganization, getOrganizationContext } from "@/lib/organizations";
import { sendEmail } from "@/lib/email/send-email";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ success: false, message: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json({ success: false, message: "You must be signed in to send a test email." }, { status: 401 });
  }

  try {
    const organizationContext = await getOrganizationContext(supabase, user);
    if (!canManageOrganization(organizationContext.activeMembership.role)) {
      return NextResponse.json({ success: false, message: "Only organization owners and admins can send test emails." }, { status: 403 });
    }

    const organizationName = organizationContext.activeOrganization.displayName ?? organizationContext.activeOrganization.name;
    const appUrl = getAppUrl();
    const result = await sendEmail({
      to: [user.email],
      subject: "HofAdmin test email",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h1 style="margin:0 0 12px;color:#18181b">HofAdmin email is working</h1>
          <p style="color:#3f3f46;line-height:1.6">This test email was sent for ${escapeHtml(organizationName)}.</p>
          <p><a href="${escapeHtml(appUrl)}" style="color:#18181b;font-weight:600">Open HofAdmin</a></p>
        </div>
      `,
      text: `HofAdmin email is working.\n\nThis test email was sent for ${organizationName}.\n\n${appUrl}`,
      organizationId: organizationContext.activeOrganization.id,
      eventType: "test_email",
      supabase,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (requestError) {
    const message = requestError instanceof Error ? requestError.message : "Test email could not be sent.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
