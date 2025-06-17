"use client";

import { Music, Search, Download, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

type OnboardingStep = {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    icon: <Music className="w-12 h-12" />,
    title: "Discover Bird Sounds",
    description:
      "Explore high-quality recordings from 'The Sound Approach to Birding' book with detailed sonograms and expert commentary.",
    color: "bg-green-500",
  },
  {
    id: 2,
    icon: <Search className="w-12 h-12" />,
    title: "Search & Learn",
    description:
      "Find specific species, recordings, or book pages quickly. Learn to identify birds by their unique sounds and calls.",
    color: "bg-blue-500",
  },
  {
    id: 3,
    icon: <Download className="w-12 h-12" />,
    title: "High-Quality Audio",
    description:
      "Stream high-quality audio recordings directly in your browser. Perfect for detailed study and analysis.",
    color: "bg-orange-500",
  },
  {
    id: 4,
    icon: <Headphones className="w-12 h-12" />,
    title: "Ready to Start!",
    description:
      "You're all set to begin your birding journey. Start exploring the amazing world of bird sounds!",
    color: "bg-purple-500",
  },
];

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="text-center pt-16 pb-8 px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to The Sound Approach
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Let&apos;s get you started with your birding journey
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div
            className={`w-24 h-24 ${currentStepData.color} rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg`}
          >
            <div className="text-white">{currentStepData.icon}</div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="p-8">
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep ? "w-8 bg-blue-600" : "w-2 bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={isCompleting}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isCompleting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </>
            ) : currentStep === onboardingSteps.length - 1 ? (
              "Get Started"
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
