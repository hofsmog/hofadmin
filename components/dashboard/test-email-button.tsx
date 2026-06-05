"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function TestEmailButton({ disabled }: { disabled?: boolean }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ status: "success" | "error"; message: string } | null>(null);

  async function sendTestEmail() {
    setPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/email/test", { method: "POST" });
      const payload = await response.json().catch(() => ({ message: "Test email failed." }));

      if (!response.ok || !payload.success) {
        setResult({ status: "error", message: payload.message || "Test email failed." });
        return;
      }

      setResult({ status: "success", message: payload.message || "Test email sent successfully." });
    } catch (error) {
      setResult({ status: "error", message: error instanceof Error ? error.message : "Test email failed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Toast show={result?.status === "success"} title="Test email sent" message={result?.message ?? ""} />
      <Toast show={result?.status === "error"} tone="error" title="Test email failed" message={result?.message ?? ""} />
      <Button type="button" variant="secondary" disabled={disabled || pending} onClick={sendTestEmail}>
        <Send className="h-4 w-4" />
        {pending ? "Sending..." : "Send test email"}
      </Button>
    </>
  );
}
