import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const authRoutes = new Set(["/login", "/signup", "/forgot-password"]);

function cloneCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  const { pathname, search } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/app");
  const isAuthRoute = authRoutes.has(pathname);

  if (!config) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", `${pathname}${search}`);
    return cloneCookies(response, NextResponse.redirect(url));
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const redirectTo = getSafeRedirectPath(request.nextUrl.searchParams.get("redirectTo"));
    url.pathname = redirectTo.pathname;
    url.search = redirectTo.search;
    return cloneCookies(response, NextResponse.redirect(url));
  }

  return response;
}

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return { pathname: "/dashboard", search: "" };
  }

  const [pathname, search = ""] = value.split("?", 2);
  return {
    pathname: pathname || "/dashboard",
    search: search ? `?${search}` : "",
  };
}
