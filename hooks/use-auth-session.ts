"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "error"; user: null; error: string };

export function useAuthSession() {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data, error }) => {
        if (!mounted) {
          return;
        }

        if (error) {
          setState({ status: "unauthenticated", user: null, error: null });
          return;
        }

        setState(
          data.user
            ? { status: "authenticated", user: data.user, error: null }
            : { status: "unauthenticated", user: null, error: null },
        );
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) {
          return;
        }

        setState(
          session?.user
            ? { status: "authenticated", user: session.user, error: null }
            : { status: "unauthenticated", user: null, error: null },
        );
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch (error) {
      queueMicrotask(() => {
        if (!mounted) {
          return;
        }

        setState({
          status: "error",
          user: null,
          error: error instanceof Error ? error.message : "Unable to initialize authentication.",
        });
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
