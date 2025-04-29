// src/screens/WelcomeScreen.tsx
"use client"

import React, { useEffect, useContext } from "react"
import { View, Text, StyleSheet, ImageBackground } from "react-native"
import { Button, ActivityIndicator } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import * as SecureStore from "expo-secure-store"
import { AuthContext } from "../context/AuthContext"
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { Platform } from "react-native"
import { RootStackParamList } from "../types"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useThemedStyles } from "../hooks/useThemedStyles"

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { state: authState } = useContext(AuthContext)
  const { theme, isDarkMode } = useThemedStyles()

  // Define styles first
  const styles = StyleSheet.create({
    backgroundImage: {
      flex: 1,
      width: "100%",
      height: "100%",
      justifyContent: "center",
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(15, 25, 40, 0.65)",
      justifyContent: "center",
    },
    container: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 32,
    },
    logoContainer: {
      alignItems: "center",
      marginTop: 24,
      marginBottom: 32,
    },
    logoCircle: {
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 54,
      width: 108,
      height: 108,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
    },
    logoImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#fff",
      textAlign: "center",
      letterSpacing: 1.2,
      marginBottom: 10,
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    },
    subtitle: {
      fontSize: 18,
      color: "#e0e0e0",
      textAlign: "center",
      opacity: 0.94,
      marginHorizontal: 18,
      marginBottom: 8,
      lineHeight: 25,
      fontWeight: '500',
    },
    buttonContainer: {
      width: "100%",
      marginBottom: 16,
    },
    button: {
      marginVertical: 8,
      borderRadius: 24,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.13,
      shadowRadius: 4,
    },
    buttonContent: {
      paddingVertical: 14,
      flexDirection: 'row-reverse',
    },
    buttonLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      letterSpacing: 0.5,
      color: '#fff',
    },
    secondaryButton: {
      backgroundColor: "rgba(255,255,255,0.13)",
      borderColor: "#fff",
      borderWidth: 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 18,
      color: theme.colors.onBackground,
      fontSize: 18,
      fontWeight: '500',
      opacity: 0.85,
    },
  });

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
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    )
  }

  return (
    <ImageBackground
      source={require('../../assets/image.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="bird" size={54} color="#fff" />
            </View>
            <Text style={styles.title}>The Sound Approach</Text>
            <Text style={styles.subtitle}>Discover, identify, and enjoy the world of birdsong. Your companion for nature and sound exploration.</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={() => {
                navigation.navigate("Login")
              }}
              icon={() => <MaterialCommunityIcons name="login" size={22} color="#fff" style={{ marginRight: 8 }} />}
              accessibilityLabel="Login to your account"
              buttonColor={theme.colors.primary}
            >
              Login
            </Button>
            <Button
              mode="outlined"
              style={[styles.button, styles.secondaryButton]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              textColor="#fff"
              onPress={() => {
                navigation.navigate("SignUp")
              }}
              icon={() => <MaterialCommunityIcons name="account-plus-outline" size={22} color="#fff" style={{ marginRight: 8 }} />}
              accessibilityLabel="Create a new account"
            >
              Sign Up
            </Button>
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

export default WelcomeScreen