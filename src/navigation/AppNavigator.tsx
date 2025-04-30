"use client"

import { useContext } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { ThemeContext } from "../context/ThemeContext"

// Screens
import WelcomeScreen from "../screens/WelcomeScreen"
import SignUpScreen from "../screens/SignUpScreen"
import LoginScreen from "../screens/LoginScreen"
import RecordingsListScreen from "../screens/RecordingsListScreen"
import RecordingDetailsScreen from "../screens/RecordingDetailsScreen"
import SpeciesDetailsScreen from "../screens/SpeciesDetailsScreen"
import DownloadsScreen from "../screens/DownloadsScreen"
import ProfileSettingsScreen from "../screens/ProfileSettingsScreen"
import SearchScreen from "../screens/SearchScreen"
import OfflineNoticeScreen from "../screens/OfflineNoticeScreen"
import { navigationDarkTheme, navigationLightTheme } from "../theme"
import React from "react"

// Context
import { AuthContext } from "../context/AuthContext"

// Stack navigators
const AuthStack = createNativeStackNavigator()
const MainStack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Auth navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  )
}

// Main tab navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Define iconName with the correct type
          let iconName: keyof typeof Ionicons.glyphMap = focused ? "musical-notes" : "musical-notes-outline" // Default icon for Recordings
          
          if (route.name === "Downloads") {
            iconName = focused ? "download" : "download-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} /> 
        },
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Recordings" component={RecordingsListScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileSettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  )
}

// Main stack navigator that includes the tab navigator
const MainNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen name="RecordingDetails" component={RecordingDetailsScreen} />
      <MainStack.Screen name="SpeciesDetails" component={SpeciesDetailsScreen} />
      <MainStack.Screen name="Search" component={SearchScreen} />
      <MainStack.Screen name="OfflineNotice" component={OfflineNoticeScreen} options={{ presentation: "modal" }} />
      <MainStack.Screen name="Profile" component={ProfileSettingsScreen}/>
      <MainStack.Screen name="Downloads" component={DownloadsScreen}/>
    </MainStack.Navigator>
  )
}

// Root navigator that switches between auth and main flows
const AppNavigator = () => {
  const { state: authState } = useContext(AuthContext)
  const { isDarkMode } = useContext(ThemeContext);
  const navTheme = isDarkMode ? navigationDarkTheme : navigationLightTheme;

  return <NavigationContainer theme={navTheme}>{authState.userToken ? <MainNavigator /> : <AuthNavigator />}</NavigationContainer>
}

export default AppNavigator