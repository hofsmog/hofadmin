"use client";

import { useRef, useState } from "react";
import { Check, CheckCircle2, RotateCcw } from "lucide-react";
import { completeInventoryLoanAction } from "@/app/dashboard/modules/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Member = Pick<Database["public"]["Tables"]["members"]["Row"], "id" | "name" | "email" | "phone">;
type Step = 1 | 2 | 3 | 4 | 5;

const steps: Array<{ number: Step; label: string }> = [
  { number: 1, label: "Borrower" },
  { number: 2, label: "Due Date" },
  { number: 3, label: "Agreement" },
  { number: 4, label: "Signature" },
  { number: 5, label: "Complete" },
];

export function InventoryLoanAgreementForm({
  itemId,
  itemName,
  members,
  agreementTemplate,
  defaultMemberId,
  defaultDueDate,
  defaultNote,
}: {
  itemId: string;
  itemName: string;
  members: Member[];
  agreementTemplate: string;
  defaultMemberId?: string | null;
  defaultDueDate?: string | null;
  defaultNote?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [dueDate, setDueDate] = useState(defaultDueDate ?? "");
  const [loanNote, setLoanNote] = useState(defaultNote ?? "");
  const [agreementText, setAgreementText] = useState(agreementTemplate);
  const selectedMember = members.find((member) => member.id === memberId);

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
    <form action={completeInventoryLoanAction} className="space-y-5">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="dueDate" value={dueDate} />
      <input type="hidden" name="loanNote" value={loanNote} />
      <input type="hidden" name="agreementText" value={agreementText} />
      <input type="hidden" name="signatureDataUrl" value={signatureDataUrl} />

      <Progress step={step} />

      {step === 1 ? (
        <section className="space-y-4">
          <StepHeader title="Choose borrower" description="Select the member who will borrow this item." />
          <label className="block space-y-2">
            <span className="text-sm font-medium">Borrower</span>
            <select value={memberId} onChange={(event) => setMemberId(event.target.value)} required className="h-12 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950">
              <option value="">Choose member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </label>
          {selectedMember ? <SummaryLine label="Selected" value={selectedMember.name} /> : null}
          <Button type="button" className="h-12 w-full" disabled={!memberId} onClick={() => setStep(2)}>
            Continue
          </Button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <StepHeader title="Choose return date" description="Pick the date this item should be returned." />
          <label className="block space-y-2">
            <span className="text-sm font-medium">Return date</span>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-12" required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Optional note</span>
            <textarea value={loanNote} onChange={(event) => setLoanNote(event.target.value)} rows={3} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" />
          </label>
          <StepButtons onBack={() => setStep(1)} nextDisabled={!dueDate} onNext={() => setStep(3)} />
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <StepHeader title="Review loan agreement" description="This text is loaded from Inventory settings. Edit it only when this loan needs different wording." />
          <textarea value={agreementText} onChange={(event) => setAgreementText(event.target.value)} rows={7} className="w-full rounded-xl border bg-white px-3 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70 dark:bg-zinc-950" />
          <StepButtons onBack={() => setStep(2)} nextDisabled={agreementText.trim().length < 20} onNext={() => setStep(4)} />
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <StepHeader title="Borrower signs" description="The borrower signs after reading and accepting the agreement." />
          <div className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900/60">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold">I have read and accepted the loan agreement.</p>
              <button type="button" onClick={clearSignature} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium shadow-sm dark:bg-zinc-950">
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={820}
              height={340}
              className="h-72 w-full touch-none rounded-xl border bg-white"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              aria-label="Signature pad"
            />
          </div>
          <StepButtons onBack={() => setStep(3)} nextDisabled={!hasSignature} onNext={() => setStep(5)} />
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <StepHeader title="Confirm loan" description="Check the details before completing the loan." />
          <div className="space-y-2 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
            <SummaryLine label="Item" value={itemName} />
            <SummaryLine label="Borrower" value={selectedMember?.name ?? "No borrower selected"} />
            <SummaryLine label="Due date" value={dueDate || "No date selected"} />
            <SummaryLine label="Signature captured" value={hasSignature ? "Yes" : "No"} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" className="h-12" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button type="submit" className="h-12 bg-emerald-600 text-white hover:bg-emerald-700" disabled={!memberId || !dueDate || !hasSignature}>
              <CheckCircle2 className="h-4 w-4" />
              Complete Loan
            </Button>
          </div>
        </section>
      ) : null}
    </form>
  );
}

function Progress({ step }: { step: Step }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {steps.map((item) => {
        const active = item.number === step;
        const complete = item.number < step;

        return (
          <div key={item.number} className="min-w-0">
            <div className={cn("grid h-9 w-9 place-items-center rounded-full text-sm font-semibold", active || complete ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900")}>
              {complete ? <Check className="h-4 w-4" /> : item.number}
            </div>
            <p className="mt-2 truncate text-xs text-muted-foreground">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function StepButtons({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button type="button" variant="secondary" className="h-12" onClick={onBack}>
        Back
      </Button>
      <Button type="button" className="h-12" disabled={nextDisabled} onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-white px-3 py-2 text-sm dark:bg-zinc-950">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
