"use client";

import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { useThemedStyles } from "../hooks/useThemedStyles";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const { theme } = useThemedStyles();

  // Effect to handle the splash screen timing
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  const styles = StyleSheet.create({
    background: {
      backgroundColor: theme.colors.background,
      flex: 1,
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    logoCircle: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 54,
      elevation: 6,
      height: 108,
      justifyContent: "center",
      marginBottom: 18,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      width: 108,
    },
    overlay: {
      alignItems: "center",
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: "center",
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 28,
      fontWeight: "bold",
      letterSpacing: 1.2,
      marginBottom: 24,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.background}>
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="bird" size={54} color="#fff" />
        </View>
        <Text style={styles.title}>The Sound Approach</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </View>
  );
};

export default SplashScreen;
