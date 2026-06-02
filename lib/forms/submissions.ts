import type { FormSubmissionHandlingStatus, FormSubmissionReadStatus } from "@/types/database";

export const handlingStatusLabels: Record<FormSubmissionHandlingStatus, string> = {
  unhandled: "Unhandled",
  partially_handled: "Partially handled",
  handled: "Handled",
  archived: "Archived",
};

export const readStatusLabels: Record<FormSubmissionReadStatus, string> = {
  new: "New",
  read: "Read",
};

const respondentNameLabels = new Set(["name", "full name"]);

export type SubmissionValueLike = {
  field_label: string;
  value: string | null;
};

export function getRespondentName(values: SubmissionValueLike[], fallback = "Unnamed response") {
  const firstName = values.find((value) => ["first name", "first"].includes(normalizeLabel(value.field_label)))?.value?.trim();
  const lastName = values.find((value) => ["last name", "last"].includes(normalizeLabel(value.field_label)))?.value?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  const exactName = values.find((value) => respondentNameLabels.has(normalizeLabel(value.field_label)) && value.value?.trim());

  if (exactName?.value) {
    return exactName.value.trim();
  }

  return fallback;
}

export function groupSubmissionValues<T extends { submission_id: string }>(values: T[]) {
  const grouped = new Map<string, T[]>();

  for (const value of values) {
    grouped.set(value.submission_id, [...(grouped.get(value.submission_id) ?? []), value]);
  }

  return grouped;
}

function normalizeLabel(label: string) {
  return label.trim().toLowerCase();
}
