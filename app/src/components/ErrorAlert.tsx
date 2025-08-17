// src/components/ErrorAlert.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, ViewStyle } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";

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
      marginBottom: 16,
      overflow: "hidden",
    },
    contentContainer: {
      flex: 1,
      marginRight: 8,
    },
    dismissButton: {
      backgroundColor: theme.colors.onBackground,
      borderRadius: theme.borderRadius.md,
      padding: 4,
    },
    errorAlert: {
      alignItems: "flex-start",
      backgroundColor: theme.colors.errorContainer,
      borderLeftColor: theme.colors.error,
      borderLeftWidth: 4,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
      flexDirection: "row",
      padding: 16,
      shadowColor: theme.colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    errorMessage: {
      color: theme.colors.onErrorContainer,
      fontSize: theme.typography.labelSmall.fontSize,
      lineHeight: 20,
    },
    errorTitle: {
      color: theme.colors.onErrorContainer,
      fontSize: theme.typography.labelMedium.fontSize,
      fontWeight: theme.typography.labelMedium.fontWeight,
      marginBottom: 4,
    },
    iconContainer: {
      marginRight: 12,
      marginTop: 2,
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
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={theme.colors.onErrorContainer} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default ErrorAlert;
