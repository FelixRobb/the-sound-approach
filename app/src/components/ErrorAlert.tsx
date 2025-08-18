// src/components/ErrorAlert.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, ViewStyle } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme";

import { Button } from "./ui";

interface ErrorAlertProps {
  error: string | null;
  onDismiss: () => void;
  style?: ViewStyle;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onDismiss, style }) => {
  const { theme } = useEnhancedTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out and fade out
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -100,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, slideAnim, opacityAnim]);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
      overflow: "hidden",
    },
    contentContainer: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    errorAlert: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderLeftColor: theme.colors.error,
      borderLeftWidth: 4,
      borderRadius: theme.borderRadius.lg,
      elevation: 2,
      flexDirection: "row",
      padding: theme.spacing.sm,
      shadowColor: theme.colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    errorMessage: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onErrorContainer",
      }),
    },
    errorTitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onErrorContainer",
      }),
    },
    iconContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.sm,
    },
  });

  if (!error) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.errorAlert,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.onErrorContainer} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
        <Button
          onPress={onDismiss}
          variant="ghost"
          icon={{ name: "close", color: theme.colors.onErrorContainer }}
          size="icon"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        />
      </Animated.View>
    </View>
  );
};

export default ErrorAlert;
