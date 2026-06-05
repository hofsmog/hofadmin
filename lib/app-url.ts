export function getAppUrl() {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://hofadmin.com").replace(/\/+$/, "");
}

export function getPublicFormUrl(slug: string) {
  return `${getAppUrl()}/forms/${slug}`;
}
