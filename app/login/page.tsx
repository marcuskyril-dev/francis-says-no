"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const LoginPage = () => {
  const router = useRouter();
  const { status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await authService.signIn(email.trim(), password);
      const redirectTo =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("redirectTo");
      router.replace(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                placeholder="francis.pennygrabber@gmail.com"
              />
            </label>
            <label className="block text-sm">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                placeholder="********"
              />
            </label>
            {errorMessage ? (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{errorMessage}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
            <Button type="button" variant="ghost" className="h-auto w-full border-0 px-0 py-0">
              Sign up
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
};

export default LoginPage;
