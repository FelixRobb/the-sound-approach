import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import BackgroundPattern from "../components/BackgroundPattern";
import DetailHeader from "../components/DetailHeader";
import ErrorAlert from "../components/ErrorAlert";
import { Input, Button, Card } from "../components/ui";
import { AuthContext } from "../context/AuthContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { RootStackParamList } from "../types";

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn, state: authState, clearError } = useContext(AuthContext);
  const { theme } = useEnhancedTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const passwordInputRef = useRef<RNTextInput>(null);

  // Handle auth errors locally to this screen
  useEffect(() => {
    if (authState.error) {
      setLocalError(authState.error);
      clearError(); // Clear from global state immediately
    }
  }, [authState.error, clearError]);

  // Create styles based on theme
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    form: {
      marginTop: 8,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    signupContainer: {
      borderTopColor: theme.colors.surfaceVariant,
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      paddingTop: 16,
    },
    signupText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 24,
      textAlign: "center",
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    welcomeIcon: {
      alignSelf: "center",
      backgroundColor: theme.colors.tertiaryContainer,
      borderRadius: theme.borderRadius.full,
      marginBottom: 16,
      padding: 16,
    },
    input: {
      marginBottom: theme.spacing.md,
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
    setLocalError(null);

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
      setLocalError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => {
    setLocalError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <BackgroundPattern />
      <DetailHeader title="Sign In" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="elevated" size="lg">
          <View style={styles.welcomeIcon}>
            <Ionicons name="person-circle-outline" size={32} color={theme.colors.tertiary} />
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your birding journey</Text>

          <ErrorAlert error={localError} onDismiss={handleDismissError} />

          <View style={styles.form}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError("");
              }}
              error={emailError}
              leftIcon={{
                name: "mail-outline",
                color: theme.colors.tertiary,
              }}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              style={styles.input}
            />

            <Input
              ref={passwordInputRef}
              type="password"
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
              }}
              error={passwordError}
              leftIcon={{
                name: "lock-closed-outline",
                color: theme.colors.tertiary,
              }}
              showPasswordToggle
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              style={styles.input}
            />

            <Button
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
              title={isLoading ? "Signing In..." : "Sign In"}
              rightIcon={{ name: "log-in-outline" }}
              size="lg"
              fullWidth
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <Button
                onPress={() => {
                  setLocalError(null); // Clear local error when navigating
                  navigation.navigate("SignUp");
                }}
                title="Sign Up"
                variant="link"
                size="sm"
              />
            </View>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
