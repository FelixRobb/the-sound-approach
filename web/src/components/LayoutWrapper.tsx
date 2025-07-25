"use client";

import type React from "react";

import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AudioProvider } from "@/contexts/AudioContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AudioProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </AudioProvider>
    </SidebarProvider>
  );
}
