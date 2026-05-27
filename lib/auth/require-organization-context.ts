import { redirect } from "next/navigation";
import { getOrganizationContext } from "@/lib/organizations";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export async function requireOrganizationContext() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user || !supabase) {
    redirect("/login");
  }

  const organizationContext = await getOrganizationContext(supabase, user);

  return { user, supabase, organizationContext };
}
