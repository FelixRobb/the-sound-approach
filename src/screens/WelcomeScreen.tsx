// src/screens/WelcomeScreen.tsx
"use client"

import { useEffect } from "react"
import { View, Text, StyleSheet, Image, ImageBackground } from "react-native"
import { Button } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import * as SecureStore from "expo-secure-store"
import { AuthContext } from "../context/AuthContext"
import { useContext } from "react"

const WelcomeScreen = () => {
  const navigation = useNavigation()
  const { state: authState } = useContext(AuthContext)

  useEffect(() => {
    // Check if user is already logged in
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync("userToken")
      if (token) {
        // Instead of using replace, let the AuthContext handle the navigation
        // The root navigator will automatically switch to MainNavigator when userToken is present
        console.log("User is already logged in, AuthContext will handle navigation")
      }
    }

    checkToken()
  }, [navigation])

  // If user is already authenticated, don't render the welcome screen
  if (authState.userToken) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Redirecting...</Text>
      </View>
    )
  }

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1591608971358-f93643d31b43?q=80&w=1470&auto=format&fit=crop" }}
      style={styles.backgroundImage}
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image source={{ uri: "https://placeholder.svg?height=100&width=100" }} style={styles.logo} />
            <Text style={styles.title}>The Sound Approach</Text>
            <Text style={styles.subtitle}>Explore the world of bird sounds with your companion app</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              onPress={() => {
                // @ts-ignore - Navigation typing issue
                navigation.navigate("Login")
              }}
            >
              Login
            </Button>
            <Button
              mode="outlined"
              style={[styles.button, styles.secondaryButton]}
              contentStyle={styles.buttonContent}
              textColor="#FFFFFF"
              onPress={() => {
                // @ts-ignore - Navigation typing issue
                navigation.navigate("SignUp")
              }}
            >
              Sign Up
            </Button>
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.8,
    marginHorizontal: 24,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 48,
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default WelcomeScreen