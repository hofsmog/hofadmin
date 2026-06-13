import { redirect } from "next/navigation";

export default function DashboardGroupsRedirectPage() {
  redirect("/dashboard/members");
}
