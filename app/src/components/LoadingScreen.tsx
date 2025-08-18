import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";

import DetailHeader from "./DetailHeader";

interface LoadingScreenProps {
  title?: string;
  backgroundPattern?: React.ReactNode;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = "Loading...",
  backgroundPattern,
}) => {
  const { theme } = useEnhancedTheme();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Only show the loader if the loading takes more than 300ms
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    loadingCard: {
      alignItems: "center",
      width: "90%",
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      {backgroundPattern}
      <DetailHeader title={showLoader ? title : ""} />
      <View style={styles.loadingContainer}>
        {showLoader && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
};

export default LoadingScreen;
