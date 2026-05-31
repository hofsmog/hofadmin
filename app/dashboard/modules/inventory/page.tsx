import { redirect } from "next/navigation";

export default function LegacyInventoryModulePage() {
  redirect("/dashboard/inventory");
}
