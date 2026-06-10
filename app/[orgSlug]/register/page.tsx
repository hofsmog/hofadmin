import { redirect } from "next/navigation";
import { OrganizationRegisterForm } from "@/components/auth/organization-register-form";
import { Card } from "@/components/ui/card";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrganizationRegisterPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${orgSlug}/register/complete`);
  }

  const supabase = await createClient();
  const { data: organization } = supabase
    ? await supabase
        .from("organizations")
        .select("name, display_name, public_registration_enabled")
        .eq("slug", orgSlug)
        .maybeSingle()
    : { data: null };

  if (!organization?.public_registration_enabled) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Registration unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This organization is not accepting public registrations right now.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <OrganizationRegisterForm
        organizationName={organization.display_name ?? organization.name}
        orgSlug={orgSlug}
      />
    </main>
  );
}
