import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { Button } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    backgroundImage: {
      flex: 1,
      height: "100%",
      width: "100%",
    },
    buttonContainer: {
      gap: 16,
      marginBottom: 20,
    },
    buttonContent: {
      flexDirection: "row-reverse",
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    buttonSection: {
      paddingHorizontal: 8,
    },
    container: {
      flex: 1,
      justifyContent: "space-between",
      paddingBottom: 50,
      paddingHorizontal: 28,
      paddingTop: 80,
    },
    gradientOverlay: {
      flex: 1,
      justifyContent: "space-between",
    },
    headerSection: {
      alignItems: "center",
      flex: 1,
      justifyContent: "flex-start",
      paddingTop: 40,
    },
    iconStyle: {
      marginRight: 12,
    },
    logoCircle: {
      alignItems: "center",
      backgroundColor: `${theme.colors.surface}CC`,
      borderColor: `${theme.colors.outline}80`,
      borderRadius: 80,
      borderWidth: 2,
      elevation: 8,
      height: 160,
      justifyContent: "center",
      marginBottom: 32,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      width: 160,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    logoIcon: {
      marginBottom: 8,
    },
    primaryButton: {
      borderRadius: 30,
      elevation: 6,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    primaryButtonLabel: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    secondaryButton: {
      backgroundColor: `${theme.colors.surfaceVariant}22`,
      borderColor: theme.colors.outline,
      borderRadius: 30,
      borderWidth: 2,
      elevation: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    secondaryButtonLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    subtitle: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "400",
      lineHeight: 26,
      marginHorizontal: 20,
      textAlign: "center",
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 42,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 16,
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
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.6)"]}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons
                  name="bird"
                  size={72}
                  color={theme.colors.onSurface}
                  style={styles.logoIcon}
                />
              </View>
              <Text style={styles.title}>The Sound Approach</Text>
              <Text style={styles.subtitle}>
                Discover, identify, and enjoy the world of birdsong. Your companion for nature and
                sound exploration.
              </Text>
            </View>
          </View>

          {/* Button Section */}
          <View style={styles.buttonSection}>
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.primaryButtonLabel}
                onPress={() => {
                  navigation.navigate("Login");
                }}
                icon={() => (
                  <MaterialCommunityIcons
                    name="login"
                    size={24}
                    color={theme.colors.onPrimary}
                    style={styles.iconStyle}
                  />
                )}
                accessibilityLabel="Login to your account"
                buttonColor={theme.colors.primary}
              >
                Login
              </Button>

              <Button
                mode="outlined"
                style={[
                  styles.secondaryButton,
                  { backgroundColor: `${theme.colors.surfaceVariant}` },
                ]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.secondaryButtonLabel}
                onPress={() => {
                  navigation.navigate("SignUp");
                }}
                icon={() => (
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.iconStyle}
                  />
                )}
                accessibilityLabel="Create a new account"
              >
                Sign Up
              </Button>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default WelcomeScreen;
