"use client";

import type React from "react";

import LayoutWrapper from "@/components/LayoutWrapper";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
