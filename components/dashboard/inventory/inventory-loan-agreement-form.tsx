"use client";

import { useRef, useState } from "react";
import { CheckCircle2, PenLine, RotateCcw } from "lucide-react";
import { completeInventoryLoanAction } from "@/app/dashboard/modules/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/database";

type Member = Pick<Database["public"]["Tables"]["members"]["Row"], "id" | "name" | "email" | "phone">;

const defaultAgreementText =
  "I confirm that I have received this item and that I am responsible for returning it in the same condition by the agreed return date.";

export function InventoryLoanAgreementForm({
  itemId,
  members,
  defaultMemberId,
  defaultDueDate,
  defaultNote,
}: {
  itemId: string;
  members: Member[];
  defaultMemberId?: string | null;
  defaultDueDate?: string | null;
  defaultNote?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<"details" | "agreement">("details");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [dueDate, setDueDate] = useState(defaultDueDate ?? "");
  const [loanNote, setLoanNote] = useState(defaultNote ?? "");

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const point = getPoint(event);
    canvas.setPointerCapture(event.pointerId);
    context.lineWidth = 3;
    context.lineCap = "round";
    context.strokeStyle = "#111827";
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasSignature(true);
    setSignatureDataUrl(canvasRef.current?.toDataURL("image/png") ?? "");
  }

  function stopDrawing() {
    setIsDrawing(false);
    setSignatureDataUrl(canvasRef.current?.toDataURL("image/png") ?? "");
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl("");
  }

  return (
    <form action={completeInventoryLoanAction} className="space-y-4">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="signatureDataUrl" value={signatureDataUrl} />
      {step === "agreement" ? (
        <>
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="dueDate" value={dueDate} />
          <input type="hidden" name="loanNote" value={loanNote} />
        </>
      ) : null}

      {step === "details" ? (
        <>
          <Select name="memberId" label="Borrower" value={memberId} onChange={setMemberId}>
            <option value="">Choose member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </Select>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Due date</span>
            <Input name="dueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Loan note</span>
            <textarea name="loanNote" value={loanNote} onChange={(event) => setLoanNote(event.target.value)} rows={3} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" />
          </label>
          <Button type="button" className="h-11 w-full" onClick={() => setStep("agreement")} disabled={!memberId}>
            Review agreement
          </Button>
        </>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Loan agreement</span>
            <textarea name="agreementText" defaultValue={defaultAgreementText} rows={5} className="w-full rounded-xl border bg-white px-3 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" />
          </label>
          <div className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Borrower signature</p>
                <p className="text-xs text-muted-foreground">Sign with a finger, stylus, or mouse.</p>
              </div>
              <button type="button" onClick={clearSignature} className="inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium shadow-sm dark:bg-zinc-950">
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={720}
              height={280}
              className="h-56 w-full touch-none rounded-xl border bg-white"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              aria-label="Signature pad"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" className="h-11" onClick={() => setStep("details")}>
              Back
            </Button>
            <Button type="submit" className="h-11" disabled={!hasSignature}>
              {hasSignature ? <CheckCircle2 className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
              Complete loan
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

function Select({ name, label, value, onChange, children }: { name: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select name={name} value={value} onChange={(event) => onChange(event.target.value)} required className="h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950">
        {children}
      </select>
    </label>
  );
}
