// Create a new file: screens/OfflineWelcomeScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemedStyles } from "../hooks/useThemedStyles";
const OfflineWelcomeScreen = () => {
  const { theme } = useThemedStyles();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    appSubtitle: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
      marginHorizontal: 24,
      textAlign: "center",
      textShadowColor: theme.colors.shadow,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    appTitle: {
      color: theme.colors.onSurface,
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 12,
      textAlign: "center",
    },
    backgroundImage: {
      flex: 1,
    },
    buttonContent: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    buttonSection: {
      gap: 16,
      paddingBottom: 20,
      paddingHorizontal: 8,
    },
    buttonText: {
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingHorizontal: 20,
      paddingTop: insets.top + 40,
    },
    disabledButton: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.outline,
      borderRadius: 100,
      borderWidth: 1.5,
      elevation: 0,
      opacity: 0.8,
      padding: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    disabledButtonText: {
      color: theme.colors.onSurfaceVariant,
    },
    gradientOverlay: {
      flex: 1,
    },
    headerSection: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingBottom: 150,
    },
    logoCircle: {
      alignItems: "center",
      backgroundColor: `${theme.colors.surface}E6`,
      borderColor: `${theme.colors.outline}40`,
      borderRadius: 60,
      borderWidth: 2,
      elevation: 8,
      height: 120,
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      width: 120,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    offlineMessage: {
      backgroundColor: `${theme.colors.errorContainer}E6`,
      borderRadius: 12,
      marginBottom: 24,
      opacity: 0.8,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    offlineMessageText: {
      color: theme.colors.onErrorContainer,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });

  return (
    <ImageBackground
      source={require("../../assets/background-sound-approach.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar style="light" translucent />
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.5)"]}
        locations={[0, 0.4, 1]}
        style={styles.gradientOverlay}
      >
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="disc-outline" size={48} color={theme.colors.primary} />
                </View>
                <Text style={styles.appTitle}>The Sound Approach</Text>
                <Text style={styles.appSubtitle}>
                  Your companion for discovering and enjoying the world of birdsong
                </Text>
              </View>
            </View>

            <View style={styles.offlineMessage}>
              <Text style={styles.offlineMessageText}>
                You&apos;re currently offline. Please connect to the internet to sign in or create
                an account.
              </Text>
            </View>

            {/* Disabled buttons */}
            <View style={styles.buttonSection}>
              <View style={styles.disabledButton}>
                <View style={styles.buttonContent}>
                  <Ionicons name="log-in-outline" size={22} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.buttonText, styles.disabledButtonText]}>
                    Sign In (Offline)
                  </Text>
                </View>
              </View>

              <View style={styles.disabledButton}>
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="person-add-outline"
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.buttonText, styles.disabledButtonText]}>
                    Create Account (Offline)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default OfflineWelcomeScreen;
