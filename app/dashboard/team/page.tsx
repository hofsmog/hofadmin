import { redirect } from "next/navigation";

export default async function TeamMembersPage() {
  redirect("/dashboard/settings/team");
}
