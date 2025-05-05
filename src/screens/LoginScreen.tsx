// src/screens/LoginScreen.tsx
"use client";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";

import { AuthContext } from "../context/AuthContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { RootStackParamList } from "../types";

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn, state: authState, clearError } = useContext(AuthContext);
  const { theme, isDarkMode } = useThemedStyles();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Create styles based on theme
  const styles = StyleSheet.create({
    backButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 8,
    },
    backgroundPattern: {
      backgroundColor: theme.colors.background,
      bottom: 0,
      left: 0,
      opacity: 0.6,
      position: "absolute",
      right: 0,
      top: 0,
    },
    button: {
      borderRadius: 8,
      marginTop: 8,
    },
    buttonContent: {
      paddingVertical: 8,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 4,
      marginHorizontal: 4,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 8,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    errorContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 8,
      flexDirection: "row",
      marginBottom: 16,
      padding: 12,
    },
    errorMessage: {
      color: theme.colors.error,
      flex: 1,
      marginLeft: 8,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 16,
      marginTop: -12,
    },
    form: {
      marginTop: 8,
    },
    header: {
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      paddingBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 50,
    },
    headerContent: {
      alignItems: "center",
      flexDirection: "row",
    },
    headerTitle: {
      color: theme.colors.onBackground,
      fontSize: 20,
      fontWeight: "600",
      marginLeft: 8,
    },
    headerTitleContainer: {
      alignItems: "center",
      flexDirection: "row",
      marginLeft: 12,
    },
    input: {
      backgroundColor: theme.colors.surface,
      flex: 1,
      paddingLeft: 40,
    },
    inputContainer: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: 16,
      position: "relative",
    },
    inputIconContainer: {
      height: "100%",
      justifyContent: "center",
      left: 8,
      paddingTop: 8,
      position: "absolute",
      zIndex: 1,
    },
    inputOutline: {
      borderRadius: 8,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    signupContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    signupLink: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    signupText: {
      color: theme.colors.onSurfaceVariant,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      marginBottom: 24,
      textAlign: "center",
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
  });

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Reset errors
    setEmailError("");
    setPasswordError("");
    clearError();

    // Validate inputs
    let isValid = true;

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    if (!isValid) return;

    // Submit form
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  // Custom header
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="log-in" size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Sign In</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!emailError}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </View>
            {emailError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {emailError}
              </HelperText>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                mode="outlined"
                secureTextEntry={!showPassword}
                error={!!passwordError}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.colors.primary}
                  />
                }
              />
            </View>
            {passwordError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {passwordError}
              </HelperText>
            ) : null}

            {authState.error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={styles.errorMessage}>{authState.error}</Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("SignUp");
                }}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;
