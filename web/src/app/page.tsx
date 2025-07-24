"use client";

import { Loader2 } from "lucide-react";

import OnboardingPage from "@/components/OnboardingPage";
import RecordingsPage from "@/components/RecordingsPage";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import WelcomePage from "@/components/WelcomePage";
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

  // Show welcome page for unauthenticated users
  if (!state.user) {
    return <WelcomePage />;
  }

  // Show onboarding if not completed, otherwise show recordings
  if (!state.hasCompletedOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Library</h1>
        </div>
      </header>
      <div className="flex-1">
        <RecordingsPage />
      </div>
    </div>
  );
}
