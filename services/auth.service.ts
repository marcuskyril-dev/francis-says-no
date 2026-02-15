import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { supabase, toServiceError } from "@/services/supabase";

const toAuthMessage = (error: Error): string => {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (message.includes("email not confirmed")) {
    return "Email is not confirmed yet.";
  }

  return "Authentication request failed. Please try again.";
};

const toAuthError = (context: string, error: Error): Error => {
  const baseError = toServiceError(context, error);
  return new Error(toAuthMessage(baseError));
};

export const authService = {
  signIn: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw toAuthError("Failed to sign in", error ?? new Error("User not returned."));
    }

    return data.user;
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw toServiceError("Failed to sign out", error);
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw toAuthError("Failed to get current user", error);
    }
    return data.user;
  },

  getSession: async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw toAuthError("Failed to get session", error);
    }
    return data.session;
  },

  subscribe: (callback: (event: AuthChangeEvent, session: Session | null) => void): (() => void) => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(callback);

    return () => subscription.unsubscribe();
  }
};
