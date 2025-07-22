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
import { TextInput, HelperText } from "react-native-paper";

import DetailHeader from "../components/DetailHeader";
import ErrorAlert from "../components/ErrorAlert";
import { AuthContext } from "../context/AuthContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

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
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 12,
      elevation: 2,
      marginTop: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    buttonText: {
      fontSize: 22,
      marginLeft: 8,
      color: theme.colors.onPrimary,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      elevation: 6,
      marginHorizontal: 4,
      padding: 28,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.4 : 0.15,
      shadowRadius: 12,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 16,
      marginTop: -12,
    },
    form: {
      marginTop: 8,
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
      left: 12,
      paddingTop: 8,
      position: "absolute",
      zIndex: 1,
    },
    inputOutline: {
      borderRadius: 12,
      borderWidth: 1.5,
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
    signupLink: {
      color: theme.colors.primary,
      fontWeight: "700",
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
      borderRadius: 32,
      marginBottom: 16,
      padding: 16,
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

  // Background pattern
  const BackgroundPattern = () => <View style={styles.backgroundPattern} />;

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
        <View style={styles.card}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="person-circle-outline" size={32} color={theme.colors.tertiary} />
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your birding journey</Text>

          <ErrorAlert error={localError} onDismiss={handleDismissError} />

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.tertiary} />
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
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>
            {emailError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {emailError}
              </HelperText>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.tertiary} />
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
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                ref={passwordInputRef}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.colors.tertiary}
                  />
                }
              />
            </View>
            {passwordError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {passwordError}
              </HelperText>
            ) : null}

            <TouchableOpacity onPress={handleSubmit} disabled={isLoading} style={styles.button}>
              <Ionicons name="log-in-outline" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.buttonText}>{isLoading ? "Signing In..." : "Sign In"}</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  setLocalError(null); // Clear local error when navigating
                  navigation.navigate("SignUp");
                }}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
