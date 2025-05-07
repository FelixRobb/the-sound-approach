// src/screens/WelcomeScreen.tsx
"use client";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { Button } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemedStyles();

  // Define styles first
  const styles = StyleSheet.create({
    backgroundImage: {
      flex: 1,
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    button: {
      borderRadius: 24,
      elevation: 2,
      marginVertical: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.13,
      shadowRadius: 4,
    },
    buttonContainer: {
      marginBottom: 16,
      width: "100%",
    },
    buttonContent: {
      flexDirection: "row-reverse",
      paddingVertical: 14,
    },
    buttonLabel: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    container: {
      flex: 1,
      justifyContent: "space-between",
      paddingBottom: 32,
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    iconStyle: {
      marginRight: 8,
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
    logoContainer: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 24,
    },
    overlay: {
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: "center",
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.onSurface,
      borderWidth: 2,
    },
    subtitle: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: "500",
      lineHeight: 25,
      marginBottom: 8,
      marginHorizontal: 18,
      opacity: 0.94,
      textAlign: "center",
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 36,
      fontWeight: "bold",
      letterSpacing: 1.2,
      marginBottom: 10,
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
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="bird" size={54} color="#fff" />
            </View>
            <Text style={styles.title}>The Sound Approach</Text>
            <Text style={styles.subtitle}>
              Discover, identify, and enjoy the world of birdsong. Your companion for nature and
              sound exploration.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={() => {
                navigation.navigate("Login");
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name="login"
                  size={22}
                  color="#fff"
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
              style={[styles.button, styles.secondaryButton]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              textColor="#fff"
              onPress={() => {
                navigation.navigate("SignUp");
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={22}
                  color="#fff"
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
    </ImageBackground>
  );
};

export default WelcomeScreen;
