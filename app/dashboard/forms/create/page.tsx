import { redirect } from "next/navigation";

export default async function FormsCreateRedirect({ searchParams }: { searchParams?: Promise<{ type?: string }> }) {
  const params = (await searchParams) ?? {};
  const suffix = params.type === "survey" || params.type === "form" ? `?type=${params.type}` : "";
  redirect(`/dashboard/forms/new${suffix}`);
}
