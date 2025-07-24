"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import WelcomePage from "@/components/WelcomePage";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { state } = useAuth();
  const router = useRouter();

  // Handle client-side redirects once auth state is known
  useEffect(() => {
    if (state.isLoading) return;

    if (state.user) {
      if (!state.hasCompletedOnboarding) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [state, router]);

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Public welcome page for unauthenticated users
  if (!state.user) {
    return <WelcomePage />;
  }

  // Fallback while redirecting (should be very brief)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}
