"use client";

import type React from "react";

import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  // Don't show sidebar while loading or for unauthenticated users or during onboarding
  if (state.isLoading || !state.user || !state.hasCompletedOnboarding) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
