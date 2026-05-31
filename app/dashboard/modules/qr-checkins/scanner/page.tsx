import { redirect } from "next/navigation";

export default function OldQrScannerPage() {
  redirect("/dashboard/qr/scanner");
}
