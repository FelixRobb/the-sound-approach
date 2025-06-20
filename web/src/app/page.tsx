"use client";

import { Loader2 } from "lucide-react";

import DashboardPage from "@/components/DashboardPage";
import OnboardingPage from "@/components/OnboardingPage";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // At this point, middleware ensures user is authenticated
  // Show onboarding if not completed, otherwise show dashboard
  if (!state.hasCompletedOnboarding) {
    return <OnboardingPage />;
  }

  return <DashboardPage />;
}
