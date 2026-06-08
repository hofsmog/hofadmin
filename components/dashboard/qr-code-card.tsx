"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { QrItemType } from "@/types/database";

type QrCardItem = {
  id: string;
  name: string;
  type: QrItemType;
  description: string | null;
  qr_value: string;
  is_active: boolean;
  created_at: string;
};

export function QrCodeCard({ item, organizationName }: { item: QrCardItem; organizationName: string }) {
  const [pngUrl, setPngUrl] = useState("");
  const [svgMarkup, setSvgMarkup] = useState("");
  const [status, setStatus] = useState<"idle" | "copied" | "downloaded">("idle");

  const fileBaseName = useMemo(
    () => `${organizationName}-${item.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    [item.name, organizationName],
  );

  useEffect(() => {
    let active = true;

    async function renderQr() {
      const [png, svg] = await Promise.all([
        QRCode.toDataURL(item.qr_value, {
          margin: 2,
          width: 640,
          color: { dark: "#111827", light: "#ffffff" },
          errorCorrectionLevel: "M",
        }),
        QRCode.toString(item.qr_value, {
          type: "svg",
          margin: 2,
          width: 640,
          color: { dark: "#111827", light: "#ffffff" },
          errorCorrectionLevel: "M",
        }),
      ]);

      if (active) {
        setPngUrl(png);
        setSvgMarkup(svg);
      }
    }

    renderQr().catch(() => {
      if (active) {
        setPngUrl("");
        setSvgMarkup("");
      }
    });

    return () => {
      active = false;
    };
  }, [item.qr_value]);

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  function downloadPng() {
    if (!pngUrl) {
      return;
    }

    downloadHref(pngUrl, `${fileBaseName || "qr-code"}.png`);
    setStatus("downloaded");
  }

  function downloadSvg() {
    if (!svgMarkup) {
      return;
    }

    const url = URL.createObjectURL(new Blob([svgMarkup], { type: "image/svg+xml" }));
    downloadHref(url, `${fileBaseName || "qr-code"}.svg`);
    URL.revokeObjectURL(url);
    setStatus("downloaded");
  }

  async function copyValue() {
    await navigator.clipboard.writeText(item.qr_value);
    setStatus("copied");
  }

  function printCard() {
    if (!pngUrl) {
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(item.name)} check-in card</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f4f5; font-family: Arial, sans-serif; color: #111827; }
            .card { width: 420px; padding: 28px; border: 1px solid #d4d4d8; border-radius: 16px; background: white; }
            .eyebrow { color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
            h1 { margin: 8px 0 4px; font-size: 26px; line-height: 1.1; }
            .org { margin: 0 0 20px; color: #52525b; font-size: 14px; }
            img { width: 100%; border: 1px solid #e4e4e7; border-radius: 12px; }
            code { display: block; margin-top: 16px; overflow-wrap: anywhere; border-radius: 10px; background: #f4f4f5; padding: 12px; font-size: 11px; color: #3f3f46; }
            @media print { body { background: white; } .card { box-shadow: none; } }
          </style>
        </head>
        <body>
          <main class="card">
            <div class="eyebrow">${escapeHtml(item.type)} check-in</div>
            <h1>${escapeHtml(item.name)}</h1>
            <p class="org">${escapeHtml(organizationName)}</p>
            <img alt="" src="${pngUrl}" />
            <code>${escapeHtml(item.qr_value)}</code>
          </main>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <article className="group overflow-hidden rounded-xl border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950">
      <Toast
        show={status !== "idle"}
        title={status === "copied" ? "Copied to clipboard" : "QR download ready"}
        message={status === "copied" ? item.name : "Your QR asset download has started."}
      />
      <div className="grid gap-4 p-4 sm:grid-cols-[11rem_1fr]">
        <div className="relative aspect-square rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
          {pngUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngUrl} alt={`${item.name} QR code`} className="h-full w-full rounded-lg bg-white object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <QrCode className="h-10 w-10 animate-pulse" />
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold">{item.name}</h3>
                <Badge className="capitalize">{item.type}</Badge>
              </div>
              {item.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
            </div>
            <Badge className={cn(item.is_active ? "" : "opacity-60")}>{item.is_active ? "Active" : "Inactive"}</Badge>
          </div>

          <code className="block overflow-x-auto rounded-xl border bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {item.qr_value}
          </code>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="h-9 px-3" onClick={downloadPng} disabled={!pngUrl}>
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button type="button" variant="secondary" className="h-9 px-3" onClick={downloadSvg} disabled={!svgMarkup}>
              <Download className="h-4 w-4" />
              SVG
            </Button>
            <Button type="button" variant="outline" className="h-9 px-3" onClick={printCard} disabled={!pngUrl}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button type="button" variant="ghost" className="h-9 px-3" onClick={copyValue}>
              {status === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy value
            </Button>
          </div>
        </div>
      </div>

      {status !== "idle" ? (
        <div className="border-t bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {status === "copied" ? "Check-in value copied." : "Download started."}
        </div>
      ) : null}
    </article>
  );
}

function downloadHref(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character] ?? character;
  });
}
