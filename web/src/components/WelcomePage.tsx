"use client";

import { Music, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

import AuthModal from "./AuthModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

import { useAuth } from "@/contexts/AuthContext";

export default function WelcomePage() {
  const { state } = useAuth();
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: "signin" | "signup";
  }>({
    isOpen: false,
    mode: "signin",
  });

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthModal({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: "signin" });
  };

  const handleModeChange = (mode: "signin" | "signup") => {
    setAuthModal({ isOpen: true, mode });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="text-center shadow-2xl border-0">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Music className="w-10 h-10" />
              </div>
            </div>
            <CardTitle className="text-3xl mb-2">The Sound Approach</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Discover the world of birdsong with our comprehensive library of high-quality
              recordings and sonogram videos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">High-Quality Recordings</p>
                  <p className="text-sm text-muted-foreground">Professional field recordings</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Visual Sonograms</p>
                  <p className="text-sm text-muted-foreground">See the sound patterns</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-tertiary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Easy Search</p>
                  <p className="text-sm text-muted-foreground">Find species quickly</p>
                </div>
              </div>
            </div>

            {/* Pro Badge */}
            <div className="flex justify-center">
              <Badge variant="default" className="px-4 py-1">
                Professional Edition
              </Badge>
            </div>

            {/* Auth Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => openAuthModal("signin")}
                className="w-full"
                size="lg"
                disabled={state.isLoading}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>

              <Button
                onClick={() => openAuthModal("signup")}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={state.isLoading}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create Account
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Access requires a valid book access code
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        mode={authModal.mode}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
