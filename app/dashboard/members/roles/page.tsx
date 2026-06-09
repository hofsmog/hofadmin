import { redirect } from "next/navigation";

export default function MembersRolesPage() {
  redirect("/dashboard/settings/team?tab=roles");
}
