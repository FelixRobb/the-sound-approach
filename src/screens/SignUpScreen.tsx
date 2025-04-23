// src/screens/SignUpScreen.tsx
"use client"

import { useState, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { TextInput, Button, HelperText, IconButton } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"

const SignUpScreen = () => {
  const navigation = useNavigation()
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Enter your email, password, and the book code found in your Sound Approach book</Text>

        <View style={styles.form}>
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
          />
          {emailError ? <HelperText type="error">{emailError}</HelperText> : null}

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
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {passwordError ? <HelperText type="error">{passwordError}</HelperText> : null}

          <View style={styles.bookCodeContainer}>
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
            />
            <TouchableOpacity style={styles.infoIcon} onPress={() => setShowTooltip(!showTooltip)}>
              <Ionicons name="information-circle-outline" size={24} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          {bookCodeError ? <HelperText type="error">{bookCodeError}</HelperText> : null}

          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                The book code can be found on the inside cover of your Sound Approach book. It's an 8-character code
                consisting of letters and numbers.
              </Text>
            </View>
          )}

          {authState.error ? <HelperText type="error">{authState.error}</HelperText> : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Sign Up
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  input: {
    marginBottom: 8,
  },
  bookCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    position: "absolute",
    right: 16,
    top: 20,
  },
  tooltip: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  tooltipText: {
    fontSize: 14,
    color: "#333333",
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
  },
})

export default SignUpScreen