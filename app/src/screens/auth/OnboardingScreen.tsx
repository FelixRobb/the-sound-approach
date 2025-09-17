import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useContext, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../../components/ui/Button";
import { AuthContext } from "../../context/AuthContext";
import { useEnhancedTheme } from "../../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../../lib/theme/typography";

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
      "Explore high-quality recordings from 'The Sound Approach to Birding' book with detailed sonagrams and expert commentary.",
    color: "#4CAF50",
  },
  {
    id: 2,
    icon: "search",
    title: "Search & Learn",
    description:
      "Find specific species, recordings, or recording numbers quickly. Learn to identify birds by their unique sounds and calls.",
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
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation values for button layout
  const nextButtonWidthAnim = useRef(new Animated.Value(1)).current; // 1 = full width, 0.5 = half width
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
      // Animate previous button slide in/out
      Animated.timing(previousButtonTranslateXAnim, {
        toValue: shouldShowPrevious ? 0 : -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, nextButtonWidthAnim, previousButtonTranslateXAnim]);

  const styles = StyleSheet.create({
    animatedButtonContainer: {
      flex: 1,
    },
    bottomContainer: {
      paddingBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    button: {
      alignItems: "center",
      borderRadius: theme.borderRadius.md,
      elevation: 2,
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      height: 56,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: Math.max(insets.bottom, theme.spacing.md),
      paddingHorizontal: theme.spacing.lg,
      paddingTop: insets.top + theme.spacing.sm,
    },
    header: {
      alignItems: "center",
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.xl,
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onBackground",
      }),
      textAlign: "center",
    },
    headerTitle: {
      color: theme.colors.onBackground,
      ...createThemedTextStyle(theme, {
        size: "6xl",
        weight: "bold",
        color: "onBackground",
      }),
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    progressContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    progressDot: {
      borderRadius: theme.borderRadius.sm,
      height: 8,
      marginHorizontal: theme.spacing.xs,
      width: 8,
    },
    progressDotActive: {
      backgroundColor: theme.colors.primary,
      width: 8,
    },
    progressDotInactive: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    stepContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sm,
    },
    stepDescription: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      paddingHorizontal: theme.spacing.md,
      textAlign: "center",
    },
    stepIconContainer: {
      alignItems: "center",
      borderRadius: theme.borderRadius.full,
      elevation: 8,
      height: 120,
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: 120,
    },
    stepTitle: {
      color: theme.colors.onBackground,
      ...createThemedTextStyle(theme, {
        size: "4xl",
        weight: "bold",
        color: "onBackground",
      }),
      marginBottom: theme.spacing.md,
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
      void handleComplete();
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
                    transform: [{ translateX: previousButtonTranslateXAnim }],
                  },
                ]}
              >
                <Button
                  variant="outline"
                  size="lg"
                  style={styles.button}
                  onPress={handlePrevious}
                  backgroundColor={theme.colors.background}
                >
                  Previous
                </Button>
              </Animated.View>
            )}

            {/* Next Button */}
            <Animated.View
              style={[
                styles.animatedButtonContainer,
                { transform: [{ translateX: nextButtonWidthAnim }] },
              ]}
            >
              <Button variant="primary" size="lg" style={styles.button} onPress={handleNext}>
                {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
              </Button>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;
