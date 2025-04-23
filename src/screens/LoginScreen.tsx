// src/screens/LoginScreen.tsx
"use client"

import { useState, useContext } from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { TextInput, Button, HelperText, IconButton } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { AuthContext } from "../context/AuthContext"

const LoginScreen = () => {
  const navigation = useNavigation()
  const { signIn, state: authState, clearError } = useContext(AuthContext)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async () => {
    // Reset errors
    setEmailError("")
    setPasswordError("")
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
    }

    if (!isValid) return

    // Submit form
    setIsLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

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

          {authState.error ? <HelperText type="error">{authState.error}</HelperText> : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Sign In
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
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
  },
})

export default LoginScreen