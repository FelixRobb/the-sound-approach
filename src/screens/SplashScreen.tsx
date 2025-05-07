"use client";

import { StatusBar } from "expo-status-bar";
import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { useThemedStyles } from "../hooks/useThemedStyles";

const SplashScreen = () => {
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    backgroundImage: {
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
    <ImageBackground
      source={require("../../assets/image.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="bird" size={54} color="#fff" />
        </View>
        <Text style={styles.title}>The Sound Approach</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </ImageBackground>
  );
};

export default SplashScreen;
