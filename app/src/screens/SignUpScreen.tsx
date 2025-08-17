// src/screens/SignUpScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import DetailHeader from "../components/DetailHeader";
import ErrorAlert from "../components/ErrorAlert";
import { Input, Button, Card } from "../components/ui";
import { AuthContext } from "../context/AuthContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import type { RootStackParamList } from "../types";

const SignUpScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp, state: authState, clearError } = useContext(AuthContext);
  const { theme } = useEnhancedTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookCode, setBookCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookCodeError, setBookCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const passwordInputRef = useRef<RNTextInput>(null);
  const bookCodeInputRef = useRef<RNTextInput>(null);

  // Handle auth errors locally to this screen
  useEffect(() => {
    if (authState.error) {
      setLocalError(authState.error);
      clearError(); // Clear from global state immediately
    }
  }, [authState.error, clearError]);

  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: theme.colors.background,
      bottom: 0,
      left: 0,
      opacity: 0.6,
      position: "absolute",
      right: 0,
      top: 0,
    },

    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    form: {
      marginTop: 8,
    },
    headerIcon: {
      alignSelf: "center",
      backgroundColor: theme.colors.tertiaryContainer,
      borderRadius: theme.borderRadius.full,
      marginBottom: 16,
      padding: 16,
    },
    loginContainer: {
      borderTopColor: theme.colors.surfaceVariant,
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      paddingTop: 16,
    },
    loginLink: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    loginText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 24,
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
    input: {
      marginBottom: theme.spacing.md,
    },
    bookCodeText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
      marginTop: -12,
    },
    bookCodeContainer: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      textAlign: "center",
    },
  });

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password (at least 6 characters)
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Validate book code format (example: 8 characters alphanumeric)
  const validateBookCode = (code: string) => {
    const codeRegex = /^[A-Za-z0-9]{8}$/;
    return codeRegex.test(code);
  };

  const handleSubmit = async () => {
    // Reset errors
    setEmailError("");
    setPasswordError("");
    setBookCodeError("");
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
    } else if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    if (!bookCode) {
      setBookCodeError("Book code is required");
      isValid = false;
    } else if (!validateBookCode(bookCode)) {
      setBookCodeError("Book code must be 8 characters (letters and numbers)");
      isValid = false;
    }

    if (!isValid) return;

    // Submit form
    setIsLoading(true);
    try {
      await signUp(email, password, bookCode);
    } catch (error) {
      console.error("Signup error:", error);
      setLocalError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => {
    setLocalError(null);
  };

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <BackgroundPattern />
      <DetailHeader title="Create Account" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="elevated" size="lg">
          <View style={styles.headerIcon}>
            <Ionicons name="person-add-outline" size={32} color={theme.colors.tertiary} />
          </View>

          <Text style={styles.title}>Join The Sound Approach</Text>
          <Text style={styles.subtitle}>Create your account to start your birding adventure</Text>

          <ErrorAlert error={localError} onDismiss={handleDismissError} />

          <View style={styles.form}>
            <Input
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
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              style={styles.input}
            />
            <Input
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
              returnKeyType="next"
              onSubmitEditing={() => bookCodeInputRef.current?.focus()}
              ref={passwordInputRef}
              style={styles.input}
            />
            <Input
              placeholder="Book Code"
              value={bookCode}
              onChangeText={(text) => {
                setBookCode(text.toUpperCase());
                setBookCodeError("");
              }}
              error={bookCodeError}
              leftIcon={{
                name: "book-outline",
                color: theme.colors.tertiary,
              }}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              ref={bookCodeInputRef}
              style={styles.input}
            />
            <View style={styles.bookCodeContainer}>
              <Text style={styles.bookCodeText}>
                Enter the 8-character code from your &quot;The Sound Approach to Birding&quot; book
                to verify your access.
              </Text>
            </View>

            <Button
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
              title={isLoading ? "Creating Account..." : "Create Account"}
              rightIcon={{ name: "person-add-outline" }}
              size="lg"
              fullWidth
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  setLocalError(null); // Clear local error when navigating
                  navigation.navigate("Login");
                }}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;
