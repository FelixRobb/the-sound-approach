import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useContext, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthContext } from "../context/AuthContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

type OnboardingStep = {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    icon: "musical-notes",
    title: "Discover Bird Sounds",
    description:
      "Explore high-quality recordings from 'The Sound Approach to Birding' book with detailed sonograms and expert commentary.",
    color: "#4CAF50",
  },
  {
    id: 2,
    icon: "search",
    title: "Search & Learn",
    description:
      "Find specific species, recordings, or book pages quickly. Learn to identify birds by their unique sounds and calls.",
    color: "#2196F3",
  },
  {
    id: 3,
    icon: "download",
    title: "Download for Offline",
    description:
      "Save your favorite recordings to listen offline in the field. Perfect for birding trips without internet connection.",
    color: "#FF9800",
  },
  {
    id: 4,
    icon: "headset",
    title: "Ready to Start!",
    description:
      "You're all set to begin your birding journey. Start exploring the amazing world of bird sounds!",
    color: "#9C27B0",
  },
];

const OnboardingScreen = () => {
  const { completeOnboarding } = useContext(AuthContext);
  const { theme } = useThemedStyles();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation values for button layout
  const nextButtonWidthAnim = useRef(new Animated.Value(1)).current; // 1 = full width, 0.5 = half width
  const previousButtonOpacityAnim = useRef(new Animated.Value(0)).current;
  const previousButtonTranslateXAnim = useRef(new Animated.Value(-100)).current;

  // Animate button layout when step changes
  useEffect(() => {
    const shouldShowPrevious = currentStep > 0;

    Animated.parallel([
      // Animate next button width
      Animated.timing(nextButtonWidthAnim, {
        toValue: shouldShowPrevious ? 0.5 : 1,
        duration: 300,
        useNativeDriver: false,
      }),
      // Animate previous button opacity
      Animated.timing(previousButtonOpacityAnim, {
        toValue: shouldShowPrevious ? 1 : 0,
        duration: shouldShowPrevious ? 400 : 200,
        useNativeDriver: true,
      }),
      // Animate previous button slide in/out
      Animated.timing(previousButtonTranslateXAnim, {
        toValue: shouldShowPrevious ? 0 : -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, nextButtonWidthAnim, previousButtonOpacityAnim, previousButtonTranslateXAnim]);

  const styles = StyleSheet.create({
    animatedButtonContainer: {
      flex: 1,
    },
    bottomContainer: {
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    button: {
      alignItems: "center",
      borderRadius: 12,
      elevation: 2,
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      height: 56,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingHorizontal: 20,
      paddingTop: insets.top + 40,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 22,
      textAlign: "center",
    },
    headerTitle: {
      color: theme.colors.onBackground,
      fontSize: 28,
      fontWeight: "800",
      marginBottom: 8,
      textAlign: "center",
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
    },
    progressContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 32,
    },
    progressDot: {
      borderRadius: 4,
      height: 8,
      marginHorizontal: 4,
      width: 8,
    },
    progressDotActive: {
      backgroundColor: theme.colors.primary,
      width: 24,
    },
    progressDotInactive: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
    },
    secondaryButtonText: {
      color: theme.colors.onSurface,
    },
    stepContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    stepDescription: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 24,
      paddingHorizontal: 20,
      textAlign: "center",
    },
    stepIconContainer: {
      alignItems: "center",
      borderRadius: 60,
      elevation: 8,
      height: 120,
      justifyContent: "center",
      marginBottom: 32,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: 120,
    },
    stepTitle: {
      color: theme.colors.onBackground,
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 16,
      textAlign: "center",
    },
  });

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding();
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome to The Sound Approach</Text>
          <Text style={styles.headerSubtitle}>
            Let&apos;s get you started with your birding journey
          </Text>
        </View>

        {/* Step Content */}
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[currentStepData.color + "20", currentStepData.color + "10"]}
            style={styles.stepIconContainer}
          >
            <Ionicons name={currentStepData.icon} size={48} color={currentStepData.color} />
          </LinearGradient>

          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>
        </Animated.View>

        {/* Bottom Navigation */}
        <View style={styles.bottomContainer}>
          {/* Progress Indicators */}
          <View style={styles.progressContainer}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep ? styles.progressDotActive : styles.progressDotInactive,
                ]}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {/* Previous Button - Animated */}
            {currentStep > 0 && (
              <Animated.View
                style={[
                  styles.animatedButtonContainer,
                  {
                    opacity: previousButtonOpacityAnim,
                    transform: [{ translateX: previousButtonTranslateXAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handlePrevious}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>Previous</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Next Button */}
            <Animated.View style={styles.animatedButtonContainer}>
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleNext}>
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;
