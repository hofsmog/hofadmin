const defaultProductionOrigin = "https://hofadmin.com";

export function getPublicAppOrigin(runtimeOrigin?: string) {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    "";
  const normalizedConfiguredOrigin = normalizeOrigin(configuredOrigin);

  if (normalizedConfiguredOrigin) {
    return normalizedConfiguredOrigin;
  }

  const normalizedRuntimeOrigin = normalizeOrigin(runtimeOrigin || "");

  if (normalizedRuntimeOrigin) {
    return normalizedRuntimeOrigin;
  }

  return defaultProductionOrigin;
}

export function getAuthCallbackUrl(nextPath: string, runtimeOrigin?: string) {
  const origin = getPublicAppOrigin(runtimeOrigin);
  return `${origin}/auth/callback?next=${encodeURIComponent(getSafeAuthNextPath(nextPath))}`;
}

export function getSafeAuthNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/onboarding";
  }

  return value;
}

function normalizeOrigin(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return "";
  }
}
