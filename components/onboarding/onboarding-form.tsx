"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarDays, Check, ClipboardCheck, Copy, FileText, Inbox, Layers3, Mail, School, SkipForward, UsersRound, Wrench } from "lucide-react";
import { completeOnboardingAction, type OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { OrganizationRole, OrganizationType } from "@/types/database";

const initialState: OnboardingState = { status: "idle", message: "" };

const organizationTypes: Array<{ label: string; value: OrganizationType; icon: typeof Building2 }> = [
  { label: "Company", value: "business", icon: Building2 },
  { label: "School", value: "school", icon: School },
  { label: "Association / Club", value: "club", icon: UsersRound },
  { label: "Other", value: "other", icon: Layers3 },
];

const starterTools = [
  { label: "My Pages", value: "my-pages", description: "A simple start page for each person.", icon: Layers3, recommended: true },
  { label: "Messages", value: "messages", description: "Internal updates and conversations.", icon: Inbox, recommended: true },
  { label: "Calendar", value: "calendar", description: "Upcoming work and reminders.", icon: CalendarDays, recommended: true },
  { label: "Groups", value: "groups", description: "Organize people by team or responsibility.", icon: UsersRound, recommended: true },
  { label: "Documents", value: "documents", description: "Files, routines and resources.", icon: FileText, recommended: true },
  { label: "Forms", value: "forms", description: "Collect and manage responses.", icon: ClipboardCheck },
  { label: "Bookings", value: "bookings", description: "Reserve rooms and resources.", icon: CalendarDays },
  { label: "Issues", value: "issues", description: "Report and follow up on problems.", icon: Wrench },
  { label: "Inventory", value: "inventory", description: "Track equipment and items.", icon: Layers3 },
];

const moduleBackedTools = new Set(["documents", "forms", "bookings", "issues", "inventory"]);

export function OnboardingForm({
  defaultOrganizationName,
  userEmail,
  userRole,
}: {
  defaultOrganizationName: string;
  userEmail: string;
  userRole: OrganizationRole;
}) {
  const [state, action, pending] = useActionState(completeOnboardingAction, initialState);
  const [step, setStep] = useState(0);
  const [organizationType, setOrganizationType] = useState<OrganizationType>("business");
  const [organizationName, setOrganizationName] = useState(defaultOrganizationName);
  const [selectedTools, setSelectedTools] = useState(starterTools.filter((tool) => tool.recommended).map((tool) => tool.value));
  const [inviteMode, setInviteMode] = useState<"email" | "link" | "skip">("skip");
  const [inviteEmail, setInviteEmail] = useState("");
  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);
  const selectedTypeLabel = organizationTypes.find((type) => type.value === organizationType)?.label ?? "Company";
  const canContinue =
    (step === 0 && organizationName.trim().length >= 2) ||
    (step === 1 && selectedTools.length > 0) ||
    step === 2 ||
    step === 3;

  function goForward() {
    if (!canContinue) {
      return;
    }

    setStep((value) => Math.min(3, value + 1));
  }

  function toggleStarterTool(toolValue: string) {
    setSelectedTools((currentTools) =>
      currentTools.includes(toolValue)
        ? currentTools.filter((value) => value !== toolValue)
        : [...currentTools, toolValue],
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Toast show={state.status === "error"} tone="error" title="Setup needs attention" message={state.message} />
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Step {step + 1} of 4</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{getStepTitle(step)}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{getStepSubtitle(step)}</p>
          </div>
          <div className="rounded-full border bg-white px-3 py-1 text-sm font-medium shadow-sm dark:bg-zinc-950">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-zinc-950 transition-all duration-300 dark:bg-zinc-100" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form action={action} className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950">
        <input type="hidden" name="organizationType" value={organizationType} />
        <input type="hidden" name="organizationName" value={organizationName} />
        {selectedTools.map((toolValue) => (
          <input key={toolValue} type="hidden" name="starterTools" value={toolValue} />
        ))}
        {selectedTools.filter((toolValue) => moduleBackedTools.has(toolValue)).map((moduleValue) => (
          <input key={moduleValue} type="hidden" name="starterModules" value={moduleValue} />
        ))}

        <div className={cn("p-6 md:p-8", step === 0 ? "block" : "hidden")}>
          <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Organization</p>
            <label className="mt-3 block space-y-2">
              <span className="text-sm font-medium">Organization name</span>
              <Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
            </label>
          </div>

          <h2 className="mt-6 text-lg font-semibold tracking-tight">What best describes your organization?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {organizationTypes.map((type) => {
              const Icon = type.icon;
              const selected = organizationType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setOrganizationType(type.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-zinc-50 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-900/60 dark:focus:ring-offset-zinc-950",
                    selected ? "border-zinc-950 bg-white shadow-sm dark:border-zinc-100 dark:bg-zinc-900" : "",
                  )}
                >
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl border", selected ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950" : "border-zinc-300 text-zinc-500")}>
                    {selected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn("p-6 md:p-8", step === 1 ? "block" : "hidden")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {starterTools.map((tool) => {
              const Icon = tool.icon;
              const selected = selectedTools.includes(tool.value);

              return (
                <button
                  key={tool.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleStarterTool(tool.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-zinc-50 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-900/60 dark:focus:ring-offset-zinc-950",
                    selected ? "border-zinc-950 bg-white shadow-sm dark:border-zinc-100 dark:bg-zinc-900" : "",
                  )}
                >
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", selected ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950" : "border-zinc-300 text-zinc-500")}>
                    {selected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{tool.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{tool.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn("p-6 md:p-8", step === 2 ? "block" : "hidden")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <InviteChoice active={inviteMode === "email"} icon={Mail} title="Invite by email" description="Add coworkers after setup." onClick={() => setInviteMode("email")} />
            <InviteChoice active={inviteMode === "link"} icon={Copy} title="Copy invite link" description="Share a link later." onClick={() => setInviteMode("link")} />
            <InviteChoice active={inviteMode === "skip"} icon={SkipForward} title="Skip for now" description="You can invite people later." onClick={() => setInviteMode("skip")} />
          </div>

          {inviteMode === "email" ? (
            <div className="mt-5 rounded-2xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Coworker email</span>
                <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} type="email" placeholder="name@company.com" />
              </label>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Email invitations are available from Team settings after setup. This step is safe to skip.
              </p>
            </div>
          ) : null}

          {inviteMode === "link" ? (
            <div className="mt-5 rounded-2xl border bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <Button type="button" variant="secondary" disabled>
                <Copy className="h-4 w-4" />
                Create invite link after setup
              </Button>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Secure organization invite links are created from Team settings after your workspace is ready.
              </p>
            </div>
          ) : null}
        </div>

        <div className={cn("p-6 md:p-8", step === 3 ? "block" : "hidden")}>
          <div className="rounded-2xl border bg-zinc-50 p-5 dark:bg-zinc-900/60">
            <h2 className="text-xl font-semibold tracking-tight">Your workspace is ready</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <SummaryItem label="Organization" value={organizationName || "Your organization"} />
              <SummaryItem label="Type" value={selectedTypeLabel} />
              <SummaryItem label="Owner/admin" value={`${userEmail} (${userRole})`} />
              <SummaryItem label="Tools" value={selectedTools.map(getToolLabel).join(", ")} />
            </div>
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
              {pending ? "Opening HofAdmin" : "Open HofAdmin"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function InviteChoice({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Mail;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-zinc-50 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-900/60 dark:focus:ring-offset-zinc-950",
        active ? "border-zinc-950 bg-white shadow-sm dark:border-zinc-100 dark:bg-zinc-900" : "",
      )}
    >
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl border", active ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950" : "border-zinc-300 text-zinc-500")}>
        {active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="mt-3 block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}

function getStepTitle(step: number) {
  if (step === 0) return "Welcome to HofAdmin";
  if (step === 1) return "Choose what you want to start with";
  if (step === 2) return "Invite your team";
  return "Your workspace is ready";
}

function getStepSubtitle(step: number) {
  if (step === 0) return "Let's set up your organization workspace.";
  if (step === 1) return "You can change this later.";
  if (step === 2) return "Add coworkers now or skip this step.";
  return "Review your setup and open HofAdmin.";
}

function getToolLabel(value: string) {
  return starterTools.find((tool) => tool.value === value)?.label ?? value;
}
