import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { ReactNode } from "react";

import { Providers } from "@/app/providers";
import { Navbar } from "@/components/ui/navbar";

import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-geist-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Francis Says No",
  description: "Francis Says No is a renovation budget intelligence dashboard for first-time homeowners in Singapore."
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning>
    <body className={`${geistMono.variable} font-sans antialiased`}>
      <Providers>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t px-4 py-3 text-center text-sm text-muted-foreground flex flex-col">
            <span className="text-sm">Francis Says No</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{new Date().getFullYear()}</span>
          </footer>
        </div>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
