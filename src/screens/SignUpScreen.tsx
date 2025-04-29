// src/screens/SignUpScreen.tsx
"use client"

import { useState, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { TextInput, Button, HelperText } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useThemedStyles } from "../hooks/useThemedStyles"

const { width } = Dimensions.get("window")

const SignUpScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { signUp, state: authState, clearError } = useContext(AuthContext)
  const { theme, isDarkMode } = useThemedStyles()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bookCode, setBookCode] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [bookCodeError, setBookCodeError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backgroundPattern: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? 
        `${theme.colors.primary}08` : // Very transparent primary color
        `${theme.colors.primary}05`,
      opacity: 0.6,
    },
    header: {
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginLeft: 8,
      color: theme.colors.onSurface,
    },
    scrollContent: {
      flexGrow: 1,
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    card: {
      padding: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginHorizontal: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 16,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      marginBottom: 24,
      textAlign: 'center',
    },
    form: {
      marginTop: 8,
    },
    inputContainer: {
      marginBottom: 16,
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputIconContainer: {
      position: 'absolute',
      left: 8,
      zIndex: 1,
      height: '100%',
      justifyContent: 'center',
      paddingTop: 8,
    },
    input: {
      flex: 1,
      paddingLeft: 40,
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderRadius: 8,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: -12,
      marginBottom: 16,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(176, 0, 32, 0.2)' : 'rgba(176, 0, 32, 0.1)',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorMessage: {
      marginLeft: 8,
      color: theme.colors.error,
      flex: 1,
    },
    button: {
      marginTop: 16,
      borderRadius: 8,
    },
    buttonContent: {
      paddingVertical: 8,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    loginText: {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    },
    loginLink: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    tooltipContainer: {
      position: "absolute",
      top: 5,
      right: 10,
      zIndex: 10,
    },
    tooltip: {
      position: "absolute",
      right: 0,
      top: 30,
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
      padding: 12,
      borderRadius: 8,
      width: width * 0.7,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 20,
    },
    tooltipText: {
      color: isDarkMode ? '#fff' : '#333',
      fontSize: 14,
      lineHeight: 20,
    },
    tooltipArrow: {
      position: "absolute",
      right: 10,
      top: -10,
      width: 0,
      height: 0,
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderBottomColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
    },
  });

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate password (at least 6 characters)
  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  // Validate book code format (example: 8 characters alphanumeric)
  const validateBookCode = (code: string) => {
    const codeRegex = /^[A-Za-z0-9]{8}$/
    return codeRegex.test(code)
  }

  const handleSubmit = async () => {
    // Reset errors
    setEmailError("")
    setPasswordError("")
    setBookCodeError("")
    clearError()

    // Validate inputs
    let isValid = true

    if (!email) {
      setEmailError("Email is required")
      isValid = false
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      isValid = false
    }

    if (!password) {
      setPasswordError("Password is required")
      isValid = false
    } else if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters")
      isValid = false
    }

    if (!bookCode) {
      setBookCodeError("Book code is required")
      isValid = false
    } else if (!validateBookCode(bookCode)) {
      setBookCodeError("Book code must be 8 characters (letters and numbers)")
      isValid = false
    }

    if (!isValid) return

    // Submit form
    setIsLoading(true)
    try {
      await signUp(email, password, bookCode)
    } catch (error) {
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Background pattern
  const BackgroundPattern = () => (
    <View style={styles.backgroundPattern} />
  )

  // Custom header
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="person-add" size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Create Account</Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Join The Sound Approach</Text>
          <Text style={styles.subtitle}>Enter your details to create a new account</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
              </View>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  setEmailError("")
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
                  setPassword(text)
                  setPasswordError("")
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
                  setBookCode(text.toUpperCase())
                  setBookCodeError("")
                }}
                mode="outlined"
                autoCapitalize="characters"
                error={!!bookCodeError}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                right={
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
                        <Text style={styles.tooltipText}>
                          The book code is an 8-character code found on the inside cover of "The Sound Approach to Birding" book.
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                }
              />
            </View>
            {bookCodeError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {bookCodeError}
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
              Create Account
            </Button>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => {
                navigation.navigate("Login")
              }}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default SignUpScreen