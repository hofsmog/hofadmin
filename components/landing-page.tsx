"use client";

import { useEffect, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import en from "@/locales/en.json";
import sv from "@/locales/sv.json";
import { Badge } from "@/components/ui/badge";
import { BrandLockup } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const dictionaries = { en, sv } as const;
type Language = keyof typeof dictionaries;
type IconKey =
  | "agreements"
  | "attendance"
  | "business"
  | "club"
  | "forms"
  | "inventory"
  | "loans"
  | "responses"
  | "school"
  | "secure"
  | "users";

const iconMap: Record<IconKey, LucideIcon> = {
  agreements: Sparkles,
  attendance: QrCode,
  business: Building2,
  club: ShieldCheck,
  forms: FileText,
  inventory: PackageCheck,
  loans: ClipboardList,
  responses: BarChart3,
  school: GraduationCap,
  secure: LockKeyhole,
  users: Users,
};

const languageOptions: Array<{ code: Language; labelKey: "english" | "swedish"; flag: string }> = [
  { code: "en", labelKey: "english", flag: "🇬🇧" },
  { code: "sv", labelKey: "swedish", flag: "🇸🇪" },
];

const languageStorageKey = "hofadmin-language";

function getIcon(icon: string): LucideIcon {
  return iconMap[icon as IconKey] ?? Sparkles;
}

export function LandingPage({ initialLanguage }: { initialLanguage: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const t = dictionaries[language];

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
    document.cookie = `${languageStorageKey}=${language}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = language === "sv" ? "sv" : "en";
  }, [language]);

  function updateLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(39,39,42,0.10),_transparent_34%),linear-gradient(180deg,_#ffffff,_#f7f7f8_52%,_#ffffff)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(244,244,245,0.10),_transparent_34%),linear-gradient(180deg,_#09090b,_#111113_52%,_#09090b)] dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLockup size="md" />
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
            <a href="#platform" className="transition hover:text-zinc-950 dark:hover:text-white">
              {t.nav.platform}
            </a>
            <a href="#features" className="transition hover:text-zinc-950 dark:hover:text-white">
              {t.nav.features}
            </a>
            <a href="#pricing" className="transition hover:text-zinc-950 dark:hover:text-white">
              {t.nav.pricing}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="language-select">
              {t.language.label}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(event) => updateLanguage(event.target.value as Language)}
              className="h-10 rounded-xl border bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm outline-none transition hover:bg-zinc-50 focus:ring-2 focus:ring-ring dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.flag} {t.language[option.labelKey]}
                </option>
              ))}
            </select>
            <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
              {t.nav.login}
            </ButtonLink>
            <ButtonLink href="/signup" className="hidden sm:inline-flex">
              {t.nav.startFree}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </nav>
      </header>

      <section id="platform" className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <Badge className="w-fit gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            {t.hero.badge}
          </Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
            {t.hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">{t.hero.subheadline}</p>
          <div className="mt-5 flex max-w-2xl flex-wrap gap-2">
            {t.hero.benefits.map((benefit) => (
              <span
                key={benefit}
                className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm shadow-zinc-950/[0.03] dark:bg-zinc-950/70 dark:text-zinc-200"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {benefit}
              </span>
            ))}
          </div>
          <p className="mt-5 max-w-2xl text-base font-medium text-zinc-800 dark:text-zinc-200">{t.hero.positioning}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup" className="h-12 px-5">
              {t.hero.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#product-preview" variant="secondary" className="h-12 px-5">
              {t.hero.secondaryCta}
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-zinc-200/70 via-white to-zinc-100 blur-2xl dark:from-zinc-800/80 dark:via-zinc-900 dark:to-zinc-950" />
          <div className="relative rounded-2xl border bg-white p-3 shadow-2xl shadow-zinc-950/10 dark:bg-zinc-950 dark:shadow-black/40">
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t.dashboardPreview.title}</p>
                  <p className="text-xs text-muted-foreground">{t.dashboardPreview.subtitle}</p>
                </div>
                <Badge>{t.dashboardPreview.badge}</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {t.dashboardPreview.stats.map(([value, label]) => (
                  <div key={label} className="rounded-xl border bg-white p-4 dark:bg-zinc-950">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {t.dashboardPreview.modules.map((module) => {
                  const Icon = getIcon(module.icon);
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
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.organizationFit.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.organizationFit.title}</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {t.organizationFit.cards.map((organization) => {
            const Icon = getIcon(organization.icon);
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
                <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t.organizationFit.commonUseCases}</p>
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
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.replace.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.replace.title}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.replace.withoutTitle}</p>
              <div className="mt-4 space-y-2">
                {t.replace.without.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                    <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-zinc-950 p-4 text-white shadow-lg shadow-zinc-950/10 dark:bg-white dark:text-zinc-950">
              <p className="text-sm font-semibold text-zinc-300 dark:text-zinc-600">{t.replace.withTitle}</p>
              <div className="mt-4 space-y-2">
                {t.replace.with.map((item) => (
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
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.productPreview.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.productPreview.title}</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {t.productPreview.cards.map((preview) => (
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
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.features.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.features.title}</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {t.features.cards.map((feature) => {
            const Icon = getIcon(feature.icon);
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
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.pilot.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.pilot.title}</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">{t.pilot.description}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {t.pilot.cards.map((card) => (
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
            <h2 className="text-2xl font-semibold tracking-tight">{t.trust.title}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {t.trust.items.map((item) => (
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
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t.pricing.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.pricing.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{t.pricing.description}</p>
            </div>
            <ButtonLink href="/signup" variant="secondary">{t.pricing.cta}</ButtonLink>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {t.pricing.plans.map((plan) => (
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
