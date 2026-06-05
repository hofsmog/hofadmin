/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComponentType } from "react";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

export type AdvancedField =
  | { name: string; label: string; type?: "text" | "date" | "datetime-local" | "number"; placeholder?: string; required?: boolean }
  | { name: string; label: string; type: "select"; options: string[]; required?: boolean }
  | { name: string; label: string; type: "textarea"; placeholder?: string; required?: boolean }
  | { name: string; label: string; type: "checkbox"; description?: string };

export type AdvancedStat = {
  label: string;
  value: number | string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
};

export function AdvancedRecordsPage({
  title,
  description,
  createTitle,
  createDescription,
  listTitle,
  listDescription,
  action,
  fields,
  stats,
  records,
  params,
  emptyTitle,
  emptyDescription,
  getRecordTitle,
  getRecordDescription,
  getRecordMeta,
  getRecordStatus,
}: {
  title: string;
  description: string;
  createTitle: string;
  createDescription: string;
  listTitle: string;
  listDescription: string;
  action: (formData: FormData) => Promise<void>;
  fields: AdvancedField[];
  stats: AdvancedStat[];
  records: any[];
  params: { created?: string; updated?: string; error?: string };
  emptyTitle: string;
  emptyDescription: string;
  getRecordTitle: (record: any) => string;
  getRecordDescription: (record: any) => string;
  getRecordMeta: (record: any) => string;
  getRecordStatus: (record: any) => string | null;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Toast show={params.created === "1"} title="Record created" message={`${title} was updated.`} />
      <Toast show={params.updated === "1"} title="Record updated" message={`${title} was saved.`} />
      <Toast show={Boolean(params.error)} tone="error" title="Record not saved" message="Check the details and try again." />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={`${stat.value}`} detail={stat.detail} icon={stat.icon} />
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{createTitle}</CardTitle>
            <CardDescription>{createDescription}</CardDescription>
          </CardHeader>
          <form action={action} className="space-y-4 p-5 pt-0">
            {fields.map((field) => (
              <FieldControl key={field.name} field={field} />
            ))}
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{listTitle}</CardTitle>
            <CardDescription>{listDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.length ? records.map((record) => (
              <article key={record.id} className="rounded-xl border bg-zinc-50 p-4 transition hover:bg-white hover:shadow-sm dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{getRecordTitle(record)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{getRecordDescription(record)}</p>
                  </div>
                  {getRecordStatus(record) ? <Badge>{labelize(getRecordStatus(record) ?? "")}</Badge> : null}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{getRecordMeta(record)}</p>
              </article>
            )) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <AlertCircle className="mx-auto h-9 w-9 text-muted-foreground" />
                <p className="mt-3 font-medium">{emptyTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function FieldControl({ field }: { field: AdvancedField }) {
  if (field.type === "textarea") {
    return (
      <label className="block space-y-2">
        <span className="text-sm font-medium">{field.label}</span>
        <textarea name={field.name} rows={4} required={field.required} placeholder={field.placeholder} className="w-full rounded-xl border bg-white px-3 py-3 text-sm shadow-sm dark:bg-zinc-950" />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block space-y-2">
        <span className="text-sm font-medium">{field.label}</span>
        <select name={field.name} required={field.required} className="h-11 w-full rounded-xl border bg-white px-3 text-sm capitalize shadow-sm dark:bg-zinc-950">
          {field.options.map((option) => (
            <option key={option} value={option}>{labelize(option)}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-start gap-3 rounded-xl border bg-zinc-50 p-3 text-sm dark:bg-zinc-900/60">
        <input name={field.name} type="checkbox" className="mt-1" />
        <span>
          <span className="block font-medium">{field.label}</span>
          {field.description ? <span className="mt-1 block text-muted-foreground">{field.description}</span> : null}
        </span>
      </label>
    );
  }

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{field.label}</span>
      <Input name={field.name} type={field.type ?? "text"} required={field.required} placeholder={field.placeholder} />
    </label>
  );
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
