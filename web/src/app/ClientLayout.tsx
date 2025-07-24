"use client";

import { Inter } from "next/font/google";
import type React from "react";

import "./globals.css";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  // Don't show sidebar for unauthenticated users or during onboarding
  if (!state.user || !state.hasCompletedOnboarding) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-background text-foreground antialiased`}>
        <AuthProvider>
          <AudioProvider>
            <LayoutContent>{children}</LayoutContent>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
