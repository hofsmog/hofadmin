import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  GraduationCap,
  LockKeyhole,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLockup } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const heroBenefits = [
  "Set up in minutes",
  "No training required",
  "Mobile-friendly",
  "Built for non-technical staff",
];

const previewModules = [
  { name: "Members", detail: "128 active", icon: Users },
  { name: "Forms", detail: "9 published", icon: FileText },
  { name: "Responses", detail: "17 new", icon: BarChart3 },
  { name: "Inventory", detail: "214 items", icon: PackageCheck },
  { name: "Attendance", detail: "37 today", icon: QrCode },
  { name: "Loans", detail: "12 active", icon: ClipboardList },
];

const withoutHofAdmin = [
  "Excel spreadsheets",
  "Google Forms",
  "Paper agreements",
  "Attendance sheets",
  "Equipment lists",
  "Multiple logins",
];

const withHofAdmin = [
  "One login",
  "One dashboard",
  "One member database",
  "One inventory system",
  "One form builder",
  "One attendance system",
];

const productPreviews = [
  {
    title: "New form response",
    status: "New",
    label: "Forms inbox",
    primary: "Camp registration",
    rows: ["Emma Lind", "2 min ago", "Mark handled"],
  },
  {
    title: "Loan awaiting return",
    status: "Due Friday",
    label: "Equipment loan",
    primary: "Projector #12",
    rows: ["Borrower: Alex", "Signed", "Send reminder"],
  },
  {
    title: "Signature completed",
    status: "Signed",
    label: "Digital agreement",
    primary: "Loan agreement",
    rows: ["Signed on phone", "PDF saved", "Item updated"],
  },
  {
    title: "Attendance checked in",
    status: "Live",
    label: "QR attendance",
    primary: "Training session",
    rows: ["37 checked in", "5 absent", "Export ready"],
  },
];

const organizationUseCases = [
  {
    title: "School",
    icon: GraduationCap,
    useCases: [
      "Student forms",
      "Attendance tracking",
      "QR check-ins",
      "Equipment loans",
      "Digital agreements",
      "Student records",
    ],
  },
  {
    title: "Club / Association",
    icon: ShieldCheck,
    useCases: [
      "Member management",
      "Registrations",
      "Attendance tracking",
      "Equipment loans",
      "Digital signatures",
      "Activities",
    ],
  },
  {
    title: "Business",
    icon: Building2,
    useCases: [
      "Employee records",
      "Visitor check-ins",
      "Forms & approvals",
      "Asset tracking",
      "Equipment loans",
      "Digital agreements",
    ],
  },
];

const featureCards = [
  {
    title: "Member Management",
    description: "Keep members organized.",
    icon: Users,
  },
  {
    title: "Forms & Applications",
    description: "Collect and manage responses.",
    icon: FileText,
  },
  {
    title: "Equipment & Loans",
    description: "Track items and borrowers.",
    icon: PackageCheck,
  },
  {
    title: "Check-ins & Attendance",
    description: "QR-based attendance tracking.",
    icon: QrCode,
  },
  {
    title: "Digital Agreements",
    description: "Sign agreements on any device.",
    icon: Sparkles,
  },
  {
    title: "Secure Access",
    description: "Simple roles and permissions.",
    icon: LockKeyhole,
  },
];

const pilotCards = [
  {
    title: "Early adopter program",
    detail: "Help shape the workflows.",
  },
  {
    title: "Pilot organizations",
    detail: "Schools, clubs and associations.",
  },
  {
    title: "Real product feedback",
    detail: "Built around daily admin.",
  },
];

const trustItems = ["Roles", "Secure login", "Protected data", "Activity history"];

const pricing = [
  { name: "Starter", price: "From $49/mo", detail: "Start with the essentials." },
  { name: "Growth", price: "Custom pricing", detail: "For growing teams that need more workflows." },
  { name: "Enterprise", price: "Custom", detail: "For larger organizations." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(39,39,42,0.10),_transparent_34%),linear-gradient(180deg,_#ffffff,_#f7f7f8_52%,_#ffffff)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(244,244,245,0.10),_transparent_34%),linear-gradient(180deg,_#09090b,_#111113_52%,_#09090b)] dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLockup size="md" />
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
            <a href="#platform" className="transition hover:text-zinc-950 dark:hover:text-white">
              Platform
            </a>
            <a href="#features" className="transition hover:text-zinc-950 dark:hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-zinc-950 dark:hover:text-white">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
              Login
            </ButtonLink>
            <ButtonLink href="/signup">
              Start free
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </nav>
      </header>

      <section id="platform" className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <Badge className="w-fit gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Built for schools, clubs and organizations
          </Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
            Stop managing your organization with spreadsheets, paper and scattered tools.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Simple administration for schools, clubs and organizations.
          </p>
          <div className="mt-5 flex max-w-2xl flex-wrap gap-2">
            {heroBenefits.map((benefit) => (
              <span
                key={benefit}
                className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm shadow-zinc-950/[0.03] dark:bg-zinc-950/70 dark:text-zinc-200"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {benefit}
              </span>
            ))}
          </div>
          <p className="mt-5 max-w-2xl text-base font-medium text-zinc-800 dark:text-zinc-200">
            The admin system that does not require a manual.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup" className="h-12 px-5">
              Start free
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#product-preview" variant="secondary" className="h-12 px-5">
              View demo
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-zinc-200/70 via-white to-zinc-100 blur-2xl dark:from-zinc-800/80 dark:via-zinc-900 dark:to-zinc-950" />
          <div className="relative rounded-2xl border bg-white p-3 shadow-2xl shadow-zinc-950/10 dark:bg-zinc-950 dark:shadow-black/40">
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Organization overview</p>
                  <p className="text-xs text-muted-foreground">Everything in one place</p>
                </div>
                <Badge>Live preview</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["17", "New responses"],
                  ["12", "Active loans"],
                  ["37", "Check-ins"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border bg-white p-4 dark:bg-zinc-950">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {previewModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <div key={module.name} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 dark:bg-zinc-950">
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate">{module.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{module.detail}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="organization-fit" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Find your fit</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Which best describes your organization?
          </h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {organizationUseCases.map((organization) => {
            const Icon = organization.icon;
            return (
              <a
                key={organization.title}
                href="#product-preview"
                className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/[0.06] dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{organization.title}</h3>
                <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Common use cases</p>
                <div className="mt-3 grid gap-2">
                  {organization.useCases.map((useCase) => (
                    <div key={useCase} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{useCase}</span>
                    </div>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section id="what-is" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Created to replace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Spreadsheets, paper forms and complicated admin systems.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Without HofAdmin</p>
              <div className="mt-4 space-y-2">
                {withoutHofAdmin.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                    <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-zinc-950 p-4 text-white shadow-lg shadow-zinc-950/10 dark:bg-white dark:text-zinc-950">
              <p className="text-sm font-semibold text-zinc-300 dark:text-zinc-600">With HofAdmin</p>
              <div className="mt-4 space-y-2">
                {withHofAdmin.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm dark:border-zinc-200 dark:bg-zinc-100">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 dark:text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product-preview" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Product preview</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your organization needs. Nothing it doesn&apos;t.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productPreviews.map((preview) => (
            <div key={preview.title} className="rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/[0.06] dark:bg-zinc-950">
              <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{preview.label}</p>
                  <span className="rounded-full border bg-white px-2.5 py-1 text-xs font-medium dark:bg-zinc-950">
                    {preview.status}
                  </span>
                </div>
                <p className="mt-4 text-lg font-semibold">{preview.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{preview.primary}</p>
                <div className="mt-4 space-y-2">
                  {preview.rows.map((row) => (
                    <div key={row} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="truncate">{row}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple tools for daily admin.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/[0.06]">
                <CardHeader>
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="proof" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Built for schools, clubs and organizations</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Early adopters are helping shape HofAdmin.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Looking for pilot organizations that want simpler admin.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {pilotCards.map((card) => (
              <div key={card.title} className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Private organization data stays protected.</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Pricing</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Replace spreadsheets, forms and paper admin from $49/month.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Simple pricing for organizations replacing spreadsheets, paper and scattered tools.
              </p>
            </div>
            <ButtonLink href="/signup" variant="secondary">Start free</ButtonLink>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className="rounded-xl border bg-zinc-50 p-5 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <FolderKanban className="h-4 w-4 text-zinc-500" />
                </div>
                <p className="mt-5 text-3xl font-semibold">{plan.price}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
