import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Layers3,
  LockKeyhole,
  Network,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Multi-tenant core",
    description: "Organization-first architecture prepared for roles, permissions, billing, and audit trails.",
    icon: Building2,
  },
  {
    title: "Modular operations",
    description: "Enable only the systems a customer needs, from QR flows to forms, bookings, and inventory.",
    icon: Layers3,
  },
  {
    title: "Enterprise control",
    description: "Clean admin surfaces for teams, settings, module governance, and security visibility.",
    icon: LockKeyhole,
  },
];

const pricing = [
  { name: "Starter", price: "$49", detail: "For small teams validating workflows" },
  { name: "Scale", price: "$149", detail: "For growing organizations and operators" },
  { name: "Enterprise", price: "Custom", detail: "For advanced tenant, role, and compliance needs" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(39,39,42,0.10),_transparent_34%),linear-gradient(180deg,_#ffffff,_#f7f7f8_52%,_#ffffff)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(244,244,245,0.10),_transparent_34%),linear-gradient(180deg,_#09090b,_#111113_52%,_#09090b)] dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950 text-sm font-bold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950">
              H
            </span>
            <span className="text-sm font-semibold">HofAdmin</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
            <a href="#features" className="transition hover:text-zinc-950 dark:hover:text-white">
              Platform
            </a>
            <a href="#pricing" className="transition hover:text-zinc-950 dark:hover:text-white">
              Pricing
            </a>
            <a href="/dashboard" className="transition hover:text-zinc-950 dark:hover:text-white">
              Dashboard
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

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <div className="flex flex-col justify-center">
          <Badge className="w-fit gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Modular SaaS core for every organization type
          </Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-6xl lg:text-7xl">
            HofAdmin
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            A premium operations platform foundation for businesses, schools, clubs,
            restaurants, and teams that need one clean place to run modular workflows.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup" className="h-12 px-5">
              Create workspace
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary" className="h-12 px-5">
              View dashboard
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-zinc-200/70 via-white to-zinc-100 blur-2xl dark:from-zinc-800/80 dark:via-zinc-900 dark:to-zinc-950" />
          <div className="relative rounded-2xl border bg-white p-3 shadow-2xl shadow-zinc-950/10 dark:bg-zinc-950 dark:shadow-black/40">
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Organization health</p>
                  <p className="text-xs text-muted-foreground">Live tenant overview</p>
                </div>
                <Badge>Enterprise</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["6 modules", "42 members", "99.9% uptime"].map((item) => (
                  <div key={item} className="rounded-xl border bg-white p-4 dark:bg-zinc-950">
                    <p className="text-lg font-semibold">{item}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Ready to scale</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {["QR System", "Forms", "Members"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border bg-white p-3 dark:bg-zinc-950">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {item}
                    </span>
                    <span className="text-xs text-muted-foreground">Enabled</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Platform foundation</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for clean growth across verticals.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
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

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Pricing preview</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Plans for each stage.</h2>
            </div>
            <ButtonLink href="/signup" variant="secondary">Compare plans</ButtonLink>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className="rounded-xl border bg-zinc-50 p-5 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <Network className="h-4 w-4 text-zinc-500" />
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
