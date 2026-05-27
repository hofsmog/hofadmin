"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { scanCheckinAction, type ScannerActionState } from "@/app/dashboard/modules/qr-checkins/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: ScannerActionState = {
  status: "idle",
  message: "Point the camera at a Hofadmin QR code.",
};

export function QrScanner({ organizationName }: { organizationName: string }) {
  const reactId = useId();
  const scannerElementId = `qr-scanner-${reactId.replace(/:/g, "")}`;
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lastScanRef = useRef({ value: "", at: 0 });
  const pendingRef = useRef(false);
  const [state, formAction, isPending] = useActionState(scanCheckinAction, initialState);
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "error">("loading");
  const [cameraMessage, setCameraMessage] = useState("Requesting camera access...");

  useEffect(() => {
    pendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(scannerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const edge = Math.floor(Math.min(width, height) * 0.72);
              return { width: edge, height: edge };
            },
          },
          (decodedText) => {
            const now = Date.now();

            if (pendingRef.current || (lastScanRef.current.value === decodedText && now - lastScanRef.current.at < 3500)) {
              return;
            }

            lastScanRef.current = { value: decodedText, at: now };
            const formData = new FormData();
            formData.set("qrValue", decodedText);
            startTransition(() => formAction(formData));
          },
          () => undefined,
        );

        if (!cancelled) {
          setCameraState("ready");
          setCameraMessage(`Scanning for ${organizationName}.`);
        }
      } catch (error) {
        if (!cancelled) {
          setCameraState("error");
          setCameraMessage(error instanceof Error ? error.message : "Camera access failed.");
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
      }
    };
  }, [formAction, organizationName, scannerElementId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="relative min-h-[26rem] bg-zinc-950">
          <div id={scannerElementId} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_38%,rgba(9,9,11,0.72)_39%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.08)] sm:h-72 sm:w-72" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm">
            {cameraState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {cameraState === "ready" ? "Camera active" : cameraState === "error" ? "Camera unavailable" : "Starting camera"}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div
          className={cn(
            "rounded-xl border p-5 shadow-sm transition",
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : state.status === "error"
                ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                : "bg-card",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/75 text-current shadow-sm dark:bg-zinc-950/60">
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : state.status === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : state.status === "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <ScanLine className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">
                {isPending ? "Submitting check-in" : state.status === "success" ? state.itemName ?? "Checked in" : "Scanner status"}
              </h2>
              <p className="mt-1 text-sm leading-6 opacity-80">{isPending ? "Validating the QR code..." : state.message}</p>
            </div>
          </div>
        </div>

        <form action={formAction} className="rounded-xl border bg-card p-5 shadow-sm">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Manual QR value</span>
            <Input name="qrValue" placeholder="hofadmin:qr:..." autoComplete="off" />
          </label>
          <Button type="submit" className="mt-4 h-11 w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit check-in
          </Button>
        </form>

        <div className="rounded-xl border bg-zinc-50 p-5 text-sm leading-6 text-muted-foreground dark:bg-zinc-900/60">
          <p>{cameraMessage}</p>
          <p className="mt-3">Use the manual field when a camera is unavailable or a printed code is damaged.</p>
        </div>
      </aside>
    </div>
  );
}
