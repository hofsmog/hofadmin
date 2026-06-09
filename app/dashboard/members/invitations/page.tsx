import { redirect } from "next/navigation";

export default async function MembersInvitationsPage() {
  redirect("/dashboard/settings/team?tab=invitations");
}
