import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";

import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Sound Approach - Web",
  description: "Discover and learn bird sounds with The Sound Approach companion web app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-background text-foreground antialiased`}>
        <AuthProvider>
          <AudioProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
