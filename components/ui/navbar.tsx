"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentBudgetRoleQuery } from "@/hooks/useProjectQueries";
import { useProjectStore } from "@/hooks/useProjectStore";
import { authService } from "@/services/auth.service";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { selectedProjectId } = useProjectStore();
  const { data: currentBudgetRole } = useCurrentBudgetRoleQuery(
    selectedProjectId,
    Boolean(user) && Boolean(selectedProjectId)
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const emailLabel = useMemo(() => {
    if (!user?.email) {
      return "Signed in";
    }

    return currentBudgetRole ? `${user.email} (${currentBudgetRole})` : user.email;
  }, [currentBudgetRole, user?.email]);

  if (pathname === "/login" || !user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await authService.signOut();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          FRANCIS SAYS NO
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{emailLabel}</span>
          <Button variant="secondary" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Signing out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
};
