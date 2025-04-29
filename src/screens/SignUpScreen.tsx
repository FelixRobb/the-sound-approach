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

const { width } = Dimensions.get("window")

const SignUpScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { signUp, state: authState, clearError } = useContext(AuthContext)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bookCode, setBookCode] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [bookCodeError, setBookCodeError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="person-add" size={24} color="#2E7D32" />
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
                <Ionicons name="mail-outline" size={20} color="#2E7D32" />
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
                theme={{ colors: { primary: '#2E7D32' } }}
              />
            </View>
            {emailError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {emailError}
              </HelperText>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#2E7D32" />
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
                theme={{ colors: { primary: '#2E7D32' } }}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color="#2E7D32"
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
                <Ionicons name="key-outline" size={20} color="#2E7D32" />
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
                theme={{ colors: { primary: '#2E7D32' } }}
              />
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setShowTooltip(!showTooltip)}
              >
                <Ionicons 
                  name="information-circle" 
                  size={22} 
                  color="#2E7D32" 
                />
              </TouchableOpacity>
            </View>
            {bookCodeError ? (
              <HelperText type="error" style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} /> {bookCodeError}
              </HelperText>
            ) : null}

            {showTooltip && (
              <View style={styles.tooltip}>
                <View style={styles.tooltipHeader}>
                  <Ionicons name="information-circle" size={20} color="#2E7D32" />
                  <Text style={styles.tooltipTitle}>About Book Codes</Text>
                </View>
                <Text style={styles.tooltipText}>
                  The book code can be found on the inside cover of your Sound Approach book. It's an 8-character code
                  consisting of letters and numbers.
                </Text>
              </View>
            )}

            {authState.error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#B00020" />
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
              buttonColor="#2E7D32"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 24,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    position: "relative",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  inputIconContainer: {
    position: "absolute",
    left: 12,
    top: 20,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    paddingLeft: 40,
    fontSize: 16,
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: "#dddddd",
  },
  infoButton: {
    position: "absolute",
    right: 12,
    top: 18,
    zIndex: 1,
  },
  errorText: {
    color: "#B00020",
    marginTop: -12,
    marginBottom: 8,
  },
  tooltip: {
    backgroundColor: "rgba(46, 125, 50, 0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tooltipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tooltipTitle: {
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 8,
  },
  tooltipText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(176, 0, 32, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    color: "#B00020",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#666666",
    fontSize: 14,
  },
  loginLink: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 14,
  },
})

export default SignUpScreen