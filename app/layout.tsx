import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { ReactNode } from "react";

import { Providers } from "@/app/providers";

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
          <main className="flex-1">{children}</main>
          <footer className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
            Francis Says No {new Date().getFullYear()}
          </footer>
        </div>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
