"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { scanCheckinAction, type ScannerActionState } from "@/app/dashboard/modules/qr-checkins/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
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
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    pendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    navigator.vibrate?.([60, 40, 60]);
    playSuccessTone();
  }, [state.status, state.itemName]);

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
      <Toast
        show={state.status === "success" || state.status === "error"}
        tone={state.status === "error" ? "error" : "success"}
        title={state.status === "error" ? "Check-in failed" : "Check-in registered"}
        message={state.status === "success" ? state.itemName : state.message}
      />
      <section className="-mx-4 overflow-hidden border bg-card shadow-sm sm:mx-0 sm:rounded-xl">
        <div className="relative min-h-[62vh] bg-zinc-950 lg:min-h-[34rem]">
          <div id={scannerElementId} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_38%,rgba(9,9,11,0.72)_39%)]" />
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-2 shadow-[0_0_0_999px_rgba(0,0,0,0.08)] transition sm:h-80 sm:w-80",
              state.status === "success" ? "border-emerald-300 shadow-emerald-500/20" : "border-white/80",
            )}
          >
            <span className="scanner-sweep absolute left-6 right-6 top-6 h-0.5 bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
          </div>
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm">
            {cameraState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {cameraState === "ready" ? "Camera active" : cameraState === "error" ? "Camera unavailable" : "Starting camera"}
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-zinc-950/70 p-4 text-white shadow-2xl backdrop-blur">
            <p className="text-sm font-semibold">Scan mode</p>
            <p className="mt-1 text-sm text-white/75">Keep the QR centered. HofAdmin submits the check-in automatically.</p>
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

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <Button type="button" variant="secondary" className="h-11 w-full" onClick={() => setManualOpen((value) => !value)}>
            {manualOpen ? "Hide manual fallback" : "Use manual fallback"}
          </Button>
          {manualOpen ? (
            <form action={formAction} className="mt-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Manual QR value</span>
                <Input name="qrValue" placeholder="hofadmin:qr:..." autoComplete="off" />
              </label>
              <Button type="submit" className="mt-4 h-11 w-full" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit check-in
              </Button>
            </form>
          ) : null}
        </div>

        <div className="rounded-xl border bg-zinc-50 p-5 text-sm leading-6 text-muted-foreground dark:bg-zinc-900/60">
          <p>{cameraMessage}</p>
          <p className="mt-3">Use the manual field when a camera is unavailable or a printed code is damaged.</p>
        </div>
      </aside>
    </div>
  );
}

function playSuccessTone() {
  try {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  } catch {
    // Browsers may block audio until interaction; vibration still provides feedback where available.
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
