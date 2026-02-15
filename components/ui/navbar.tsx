import Link from "next/link";

import { Button } from "@/components/ui/button";

interface NavbarProps {
  email: string;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const Navbar = ({ email, onLogout, isLoggingOut = false }: NavbarProps) => (
  <header className="border-b border-border">
    <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        FRANCIS SAYS NO
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{email}</span>
        <Button variant="secondary" onClick={onLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Signing out..." : "Logout"}
        </Button>
      </div>
    </div>
  </header>
);
