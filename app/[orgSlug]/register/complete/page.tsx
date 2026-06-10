import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { setActiveOrganizationCookie } from "@/lib/organizations";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompleteOrganizationRegistrationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/${orgSlug}/register/complete`)}`);
  }

  const { data: organizationId, error } = await supabase.rpc("join_public_organization_by_slug", {
    p_slug: orgSlug,
  });

  if (error || !organizationId) {
    console.error("[organization-register] Could not join organization", { orgSlug, userId: user.id, error });
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Could not join organization</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Registration may be closed, or this organization could not be found.
          </p>
        </Card>
      </main>
    );
  }

  await setActiveOrganizationCookie(organizationId);
  redirect("/app/my-pages");
}
