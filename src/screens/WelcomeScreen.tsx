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
import backgroundImage from '../../assets/image.png'

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { state: authState } = useContext(AuthContext)
  const { theme } = useThemedStyles()

  // Define styles first
  const styles = StyleSheet.create({
    backgroundImage: {
      flex: 1,
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    button: {
      borderRadius: 24,
      elevation: 2,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.13,
      shadowRadius: 4,
    },
    buttonContainer: {
      marginBottom: 16,
      width: "100%",
    },
    buttonContent: {
      flexDirection: 'row-reverse',
      paddingVertical: 14,
    },
    buttonLabel: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    container: {
      flex: 1,
      justifyContent: "space-between",
      paddingBottom: 32,
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    loadingContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: "center",
    },
    loadingText: {
      color: theme.colors.onBackground,
      fontSize: 18,
      fontWeight: '500',
      marginTop: 18,
      opacity: 0.85,
    },
    logoCircle: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 54,
      elevation: 6,
      height: 108,
      justifyContent: 'center',
      marginBottom: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      width: 108,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 24,
    },
    overlay: {
      backgroundColor: "rgba(15, 25, 40, 0.65)",
      flex: 1,
      justifyContent: "center",
    },
    secondaryButton: {
      backgroundColor: "rgba(255,255,255,0.13)",
      borderColor: "#fff",
      borderWidth: 2,
    },
    subtitle: {
      color: "#e0e0e0",
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 25,
      marginBottom: 8,
      marginHorizontal: 18,
      opacity: 0.94,
      textAlign: "center",
    },
    title: {
      color: "#fff",
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
      fontSize: 36,
      fontWeight: "bold",
      letterSpacing: 1.2,
      marginBottom: 10,
      textAlign: "center",
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
      source={backgroundImage}
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
              <Text>Login</Text>
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
              <Text>Sign Up</Text>
            </Button>
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

export default WelcomeScreen