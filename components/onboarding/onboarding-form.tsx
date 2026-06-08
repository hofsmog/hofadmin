"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Layers3 } from "lucide-react";
import { completeOnboardingAction, type OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { OrganizationType } from "@/types/database";

const initialState: OnboardingState = { status: "idle", message: "" };

const organizationTypes: Array<{ label: string; value: OrganizationType }> = [
  { label: "School", value: "school" },
  { label: "Club", value: "club" },
  { label: "Business", value: "business" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Cafe", value: "cafe" },
  { label: "Event", value: "event" },
  { label: "Other", value: "other" },
];

const starterModules = [
  { label: "Attendance & Check-ins", value: "qr-checkins" },
  { label: "Members", value: "members" },
  { label: "Forms", value: "forms" },
  { label: "Surveys", value: "surveys" },
  { label: "Inventory", value: "inventory" },
  { label: "Documents", value: "documents" },
  { label: "Bookings", value: "bookings" },
];

const checklist = ["Create first check-in point", "Add first member", "Invite team member", "Customize organization branding"];

export function OnboardingForm({ defaultOrganizationName }: { defaultOrganizationName: string }) {
  const [state, action, pending] = useActionState(completeOnboardingAction, initialState);
  const [step, setStep] = useState(0);
  const [organizationType, setOrganizationType] = useState<OrganizationType>("business");
  const [organizationName, setOrganizationName] = useState(defaultOrganizationName);
  const [selectedModules, setSelectedModules] = useState(["qr-checkins", "members"]);
  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);
  const canContinue =
    step === 0 ||
    (step === 1 && organizationType && organizationName.trim().length >= 2) ||
    (step === 2 && selectedModules.length > 0) ||
    step === 3;

  function goForward() {
    if (!canContinue) {
      return;
    }

    setStep((value) => Math.min(3, value + 1));
  }

  function toggleStarterModule(moduleValue: string) {
    setSelectedModules((currentModules) =>
      currentModules.includes(moduleValue)
        ? currentModules.filter((value) => value !== moduleValue)
        : [...currentModules, moduleValue],
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Toast show={state.status === "error"} tone="error" title="Setup needs attention" message={state.message} />
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Workspace setup</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome to HofAdmin</h1>
          </div>
          <div className="rounded-full border bg-white px-3 py-1 text-sm font-medium shadow-sm dark:bg-zinc-950">
            Step {step + 1} of 4
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-zinc-950 transition-all duration-300 dark:bg-zinc-100" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form action={action} className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950">
        <input type="hidden" name="organizationType" value={organizationType} />
        <input type="hidden" name="organizationName" value={organizationName} />
        {selectedModules.map((moduleValue) => (
          <input key={moduleValue} type="hidden" name="starterModules" value={moduleValue} />
        ))}

        <div className={cn("p-6 md:p-8", step === 0 ? "block" : "hidden")}>
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
                <Layers3 className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">Set your workspace direction</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                HofAdmin adapts to schools, clubs, businesses, restaurants, events, and operations teams.
              </p>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-4 text-sm leading-6 text-muted-foreground dark:bg-zinc-900/60">
              Choose the closest fit. You can refine modules, branding, and member structure later.
            </div>
          </div>
        </div>

        <div className={cn("p-6 md:p-8", step === 1 ? "block" : "hidden")}>
          <h2 className="text-xl font-semibold tracking-tight">Choose organization type</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organizationTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={organizationType === type.value}
                onClick={() => setOrganizationType(type.value)}
                className={cn(
                  "rounded-xl border bg-zinc-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 dark:focus:ring-offset-zinc-950",
                  organizationType === type.value
                    ? "border-zinc-950 bg-white shadow-sm ring-2 ring-zinc-950/10 dark:border-zinc-100 dark:bg-zinc-900 dark:ring-white/10"
                    : "",
                )}
              >
                <span className="flex items-center justify-between gap-3 text-sm font-medium">
                  {type.label}
                  <Check className={cn("h-4 w-4 transition", organizationType === type.value ? "opacity-100" : "opacity-0")} />
                </span>
              </button>
            ))}
          </div>
          <label className="mt-6 block space-y-2">
            <span className="text-sm font-medium">Confirm organization name</span>
            <Input
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              required
            />
          </label>
        </div>

        <div className={cn("p-6 md:p-8", step === 2 ? "block" : "hidden")}>
          <h2 className="text-xl font-semibold tracking-tight">Choose starter modules</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Start small. These choices help shape your first dashboard.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {starterModules.map((module) => (
              <button
                key={module.value}
                type="button"
                aria-pressed={selectedModules.includes(module.value)}
                onClick={() => toggleStarterModule(module.value)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-zinc-50 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-900/60 dark:focus:ring-offset-zinc-950",
                  selectedModules.includes(module.value)
                    ? "border-zinc-950 bg-white shadow-sm dark:border-zinc-100 dark:bg-zinc-900"
                    : "",
                )}
              >
                <span className={cn("grid h-5 w-5 place-items-center rounded border", selectedModules.includes(module.value) ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950" : "border-zinc-300")}>
                  {selectedModules.includes(module.value) ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="text-sm font-medium">{module.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={cn("p-6 md:p-8", step === 3 ? "block" : "hidden")}>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">Your setup checklist</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-zinc-500 dark:bg-zinc-950">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-zinc-50 p-4 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" disabled={step === 0 || pending} onClick={() => setStep((value) => Math.max(0, value - 1))}>
            Back
          </Button>
          {step < 3 ? (
            <Button type="button" disabled={pending || !canContinue} onClick={goForward}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? "Finishing setup" : "Finish setup"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
