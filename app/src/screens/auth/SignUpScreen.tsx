// src/screens/SignUpScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useContext, useRef } from "react";
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

import DetailHeader from "../../components/DetailHeader";
import { Input, Button, Card } from "../../components/ui";
import { AuthContext } from "../../context/AuthContext";
import { useEnhancedTheme } from "../../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../../lib/theme";
import type { RootStackParamList } from "../../types";

const SignUpScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp } = useContext(AuthContext);
  const { theme } = useEnhancedTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookCode, setBookCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookCodeError, setBookCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordInputRef = useRef<RNTextInput>(null);
  const bookCodeInputRef = useRef<RNTextInput>(null);

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

    bookCodeContainer: {
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      textAlign: "center",
    },
    bookCodeText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: -theme.spacing.sm,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    form: {
      marginTop: theme.spacing.sm,
    },
    headerIcon: {
      alignSelf: "center",
      backgroundColor: theme.colors.tertiaryContainer,
      borderRadius: theme.borderRadius.full,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
    },
    input: {
      marginBottom: theme.spacing.md,
    },
    loginContainer: {
      borderTopColor: theme.colors.surfaceVariant,
      borderTopWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    loginLink: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "bold",
        color: "primary",
      }),
    },
    loginText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
    },
    subtitle: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    title: {
      ...createThemedTextStyle(theme, {
        size: "2xl",
        weight: "bold",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.sm,
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
    } finally {
      setIsLoading(false);
    }
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
        <Card variant="elevated" size="lg" padding={theme.spacing.md}>
          <View style={styles.headerIcon}>
            <Ionicons name="person-add-outline" size={32} color={theme.colors.tertiary} />
          </View>

          <Text style={styles.title}>Join The Sound Approach</Text>
          <Text style={styles.subtitle}>Create your account to start your birding adventure</Text>

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
              onSubmitEditing={() => void handleSubmit()}
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
              onPress={() => void handleSubmit()}
              disabled={isLoading}
              loading={isLoading}
              title={isLoading ? "Creating Account..." : "Create Account"}
              rightIcon={{ name: "person-add-outline" }}
              size="lg"
              variant="primary"
              fullWidth
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => {
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
