"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentBudgetRoleQuery } from "@/hooks/useProjectQueries";
import { useProjectStore } from "@/hooks/useProjectStore";
import { authService } from "@/services/auth.service";
import { EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuContainerRef = useRef<HTMLDivElement | null>(null);

  const emailLabel = useMemo(() => {
    if (!user?.email) {
      return "Signed in";
    }

    return currentBudgetRole ? `${user.email} (${currentBudgetRole})` : user.email;
  }, [currentBudgetRole, user?.email]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!mobileMenuContainerRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

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
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          FRANCIS SAYS NO
        </Link>
        <div ref={mobileMenuContainerRef} className="relative flex items-center gap-3">
          <Link
            href="/delivery-schedule"
            className="hidden text-sm text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300 md:inline-flex"
          >
            Delivery schedule
          </Link>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center text-foreground"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-menu"
            onClick={() => setIsMobileMenuOpen((previousValue) => !previousValue)}
          >
            <span className="sr-only">{isMobileMenuOpen ? "Close menu" : "Open menu"}</span>
            <EllipsisVertical size={20} aria-hidden="true" />
          </button>

          <div
            id="navbar-menu"
            aria-hidden={!isMobileMenuOpen}
            className={`fixed inset-x-0 top-14 z-20 border-b border-border bg-background px-4 py-3 transition-all duration-200 ease-out md:absolute md:right-0 md:top-10 md:z-30 md:w-72 md:inset-x-auto md:border md:px-3 ${isMobileMenuOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "-translate-y-2 opacity-0 pointer-events-none"
              }`}
          >
            <div className="mb-3 md:hidden">
              <Link
                href="/delivery-schedule"
                className="block text-sm text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Delivery schedule
              </Link>
            </div>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{emailLabel}</p>
            <Button
              variant="secondary"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-center"
            >
              {isLoggingOut ? "Signing out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
