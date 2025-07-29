import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      paddingHorizontal: 32,
      paddingVertical: 18,
    },
    buttonSection: {
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.3,
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
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      elevation: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
    secondaryButton: {
      alignSelf: "center",
      marginTop: 24,
    },
    secondaryButtonContent: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      justifyContent: "center",
    },
    secondaryButtonText: {
      color: `${theme.colors.onSurface}80`,
      fontSize: 15,
      fontWeight: "400",
    },
    signInLink: {
      color: theme.colors.tertiary,
      fontSize: 15,
      fontWeight: "500",
      textDecorationLine: "underline",
    },
    signInIcon: {
      marginLeft: 4,
    },
  });

  return (
    <ImageBackground
      source={require("../../assets/background-sound-approach.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.9)"]}
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

            {/* Button Section */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate("SignUp")}
                activeOpacity={0.85}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="person-add-outline" size={20} color={theme.colors.onPrimary} />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>Create Account</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.6}
              >
                <View style={styles.secondaryButtonContent}>
                  <Text style={styles.secondaryButtonText}>Already have an account? </Text>
                  <Text style={styles.signInLink}>Sign in</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default WelcomeScreen;
