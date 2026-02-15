"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status !== "authenticated") {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Checking session...</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
};
