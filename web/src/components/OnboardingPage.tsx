"use client";

import { ChevronLeft, ChevronRight, Music, Search, Download, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
    title: "Welcome to The Sound Approach",
    description:
      "Discover the world of birdsong with our comprehensive library of high-quality recordings and sonogram videos.",
    color: "bg-primary",
  },
  {
    id: 2,
    icon: <Search className="w-12 h-12" />,
    title: "Search & Explore",
    description:
      "Find recordings by species name, recording number, or keywords. Use our powerful search to discover new sounds.",
    color: "bg-secondary",
  },
  {
    id: 3,
    icon: <Download className="w-12 h-12" />,
    title: "Download app for Offline",
    description:
      "Download the app to your device for offline listening. Perfect for field trips and areas with poor connectivity.",
    color: "bg-tertiary",
  },
  {
    id: 4,
    icon: <Check className="w-12 h-12" />,
    title: "You're All Set!",
    description: "Start exploring the library and enjoy learning about bird sounds. Happy birding!",
    color: "bg-success",
  },
];

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = (): void => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (): void => {
    void completeOnboarding();
    router.push("/dashboard");
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicators */}
        <div className="flex justify-center mb-8 space-x-2">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Main card */}
        <Card className="text-center shadow-2xl border-0">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className={`${currentStepData.color} text-primary-foreground p-6 rounded-full`}>
                {currentStepData.icon}
              </div>
            </div>
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step counter */}
            <div className="flex justify-center">
              <Badge variant="secondary">
                Step {currentStep + 1} of {onboardingSteps.length}
              </Badge>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  void handlePrevious();
                }}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {isLastStep ? (
                <Button
                  onClick={() => {
                    void handleComplete();
                  }}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    void handleNext();
                  }}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Skip option */}
            {!isLastStep && (
              <Button
                variant="ghost"
                onClick={() => {
                  void handleComplete();
                }}
                className="w-full text-sm"
              >
                Skip tutorial
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
