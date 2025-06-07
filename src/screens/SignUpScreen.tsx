// src/screens/SignUpScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";

import DetailHeader from "../components/DetailHeader";
import ErrorAlert from "../components/ErrorAlert";
import { AuthContext } from "../context/AuthContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const SignUpScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp, state: authState, clearError } = useContext(AuthContext);
  const { theme, isDarkMode } = useThemedStyles();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookCode, setBookCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookCodeError, setBookCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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
    button: {
      borderRadius: 12,
      elevation: 2,
      marginTop: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    buttonContent: {
      paddingVertical: 12,
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
    headerIcon: {
      alignSelf: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 32,
      marginBottom: 16,
      padding: 16,
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
    tooltip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      borderWidth: 1,
      elevation: 8,
      padding: 16,
      position: "absolute",
      right: 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      top: 40,
      width: width * 0.8,
      zIndex: 20,
    },
    // eslint-disable-next-line react-native/no-color-literals
    tooltipArrow: {
      borderBottomColor: theme.colors.surface,
      borderBottomWidth: 12,
      borderLeftColor: "transparent",
      borderLeftWidth: 12,
      borderRightColor: "transparent",
      borderRightWidth: 12,
      height: 0,
      position: "absolute",
      right: 12,
      top: -12,
      width: 0,
    },
    tooltipContainer: {
      padding: 8,
      position: "absolute",
      right: 12,
      top: 12,
      zIndex: 10,
    },
    tooltipText: {
      color: theme.colors.onSurface,
      fontSize: 14,
      lineHeight: 20,
    },
    tooltipTitle: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
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
    <View style={styles.container}>
      <BackgroundPattern />
      <DetailHeader title="Create Account" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerIcon}>
            <Ionicons name="person-add-outline" size={32} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Join The Sound Approach</Text>
          <Text style={styles.subtitle}>Create your account to start your birding adventure</Text>

          <ErrorAlert error={localError} onDismiss={handleDismissError} />

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

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                label="Book Code"
                value={bookCode}
                onChangeText={(text) => {
                  setBookCode(text.toUpperCase());
                  setBookCodeError("");
                }}
                mode="outlined"
                autoCapitalize="characters"
                error={!!bookCodeError}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              <TouchableOpacity
                style={styles.tooltipContainer}
                onPress={() => setShowTooltip(!showTooltip)}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                {showTooltip && (
                  <View style={styles.tooltip}>
                    <View style={styles.tooltipArrow} />
                    <Text style={styles.tooltipTitle}>Book Code Help</Text>
                    <Text style={styles.tooltipText}>
                      The book code is an 8-character code found on the inside cover of &quot;The
                      Sound Approach to Birding&quot; book. It consists of letters and numbers.
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {bookCodeError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {bookCodeError}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

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
        </View>
      </ScrollView>
    </View>
  );
};

export default SignUpScreen;
