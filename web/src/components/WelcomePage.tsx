"use client";

import { LogIn, UserPlus, Disc } from "lucide-react";
import { useState } from "react";

import AuthModal from "./AuthModal";

export default function WelcomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const handleSignIn = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900" />

      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-full flex items-center justify-center mb-6">
              <Disc className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
              The Sound Approach
            </h1>
            <p className="text-lg text-white/90 text-center max-w-md leading-relaxed">
              Your companion for discovering and enjoying the world of birdsong
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-8 pb-8 space-y-4">
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </button>

          <button
            onClick={handleSignUp}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all duration-200"
          >
            <UserPlus className="w-5 h-5" />
            Create Account
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
