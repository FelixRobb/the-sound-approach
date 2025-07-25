import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Sound Approach - Web",
  description: "Discover and learn bird sounds with The Sound Approach companion web app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
