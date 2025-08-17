import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../components/ui";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { RootStackParamList } from "../types";

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useEnhancedTheme();
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
    buttonSection: {
      paddingBottom: 20,
      paddingHorizontal: 20,
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
      borderRadius: theme.borderRadius.full,
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
      borderRadius: theme.borderRadius.full,
    },
    signInLink: {
      marginTop: 16,
      color: theme.colors.tertiary,
      fontWeight: theme.typography.titleMedium.fontWeight,
    },
  });

  return (
    <ImageBackground
      source={require("../../assets/background-sound-approach.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={
          isDark
            ? ["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.9)"]
            : ["rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0.9)"]
        }
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
              <Button
                variant="default"
                size="lg"
                onPress={() => navigation.navigate("SignUp")}
                title="Create Account"
                style={styles.primaryButton}
                icon={{ name: "person-add-outline", color: theme.colors.onPrimary }}
                fullWidth
              />

              <Button
                variant="link"
                size="lg"
                onPress={() => navigation.navigate("Login")}
                title="Sign in"
                fullWidth
                textStyle={styles.signInLink}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default WelcomeScreen;
