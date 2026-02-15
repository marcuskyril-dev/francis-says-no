"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { authService } from "@/services/auth.service";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface UseAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  status: AuthStatus;
  error: string | null;
}

export const useAuth = (): UseAuthState => {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    session: null,
    isLoading: true,
    status: "loading",
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async (): Promise<void> => {
      try {
        const [session, user] = await Promise.all([
          authService.getSession(),
          authService.getCurrentUser()
        ]);

        if (!isMounted) {
          return;
        }

        const status: AuthStatus = session?.user ? "authenticated" : "unauthenticated";
        setState({ session, user, isLoading: false, status, error: null });
      } catch (error) {
        if (isMounted) {
          setState({
            session: null,
            user: null,
            isLoading: false,
            status: "unauthenticated",
            error: error instanceof Error ? error.message : "Failed to hydrate auth session."
          });
        }
      }
    };

    void hydrateSession();

    const unsubscribe = authService.subscribe((_event, session) => {
      const status: AuthStatus = session?.user ? "authenticated" : "unauthenticated";
      setState({ session, user: session?.user ?? null, isLoading: false, status, error: null });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return state;
};
