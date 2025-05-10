"use client";

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import DownloadsScreen from "../screens/DownloadsScreen";
import LoginScreen from "../screens/LoginScreen";
import OfflineNoticeScreen from "../screens/OfflineNoticeScreen";
import ProfileSettingsScreen from "../screens/ProfileSettingsScreen";
import RecordingDetailsScreen from "../screens/RecordingDetailsScreen";
import RecordingsListScreen from "../screens/RecordingsListScreen";
import SearchScreen from "../screens/SearchScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SpeciesDetailsScreen from "../screens/SpeciesDetailsScreen";
import SplashScreen from "../screens/SplashScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import { navigationDarkTheme, navigationLightTheme } from "../theme";

// Context

// Stack navigators
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

// Main tab navigator
const MainTabNavigator = () => {
  const { theme } = useThemedStyles();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Define iconName with the correct type
          let iconName: keyof typeof Ionicons.glyphMap = focused
            ? "musical-notes"
            : "musical-notes-outline"; // Default icon for Recordings

          if (route.name === "Downloads") {
            iconName = focused ? "download" : "download-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen
        name="Recordings"
        component={RecordingsListScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} options={{ headerShown: false }} />
      <Tab.Screen
        name="Profile"
        component={ProfileSettingsScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

// Main stack navigator that includes the tab navigator
const MainNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen name="RecordingDetails" component={RecordingDetailsScreen} />
      <MainStack.Screen name="SpeciesDetails" component={SpeciesDetailsScreen} />
      <MainStack.Screen name="Search" component={SearchScreen} />
      <MainStack.Screen
        name="OfflineNotice"
        component={OfflineNoticeScreen}
        options={{ presentation: "modal" }}
      />
      <MainStack.Screen name="Profile" component={ProfileSettingsScreen} />
      <MainStack.Screen name="Downloads" component={DownloadsScreen} />
    </MainStack.Navigator>
  );
};

// Root navigator that switches between auth and main flows
const AppNavigator = () => {
  const { state: authState } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navTheme = isDarkMode ? navigationDarkTheme : navigationLightTheme;

  return (
    <NavigationContainer theme={navTheme}>
      {authState.isLoading ? (
        <SplashScreen />
      ) : authState.userToken ? (
        <MainNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
