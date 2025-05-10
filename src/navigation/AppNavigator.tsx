"use client";

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext, useEffect } from "react";
import { StyleSheet, View, Platform } from "react-native";

import OfflineIndicator from "../components/OfflineIndicator";
import { AuthContext } from "../context/AuthContext";
import { OfflineContext, OfflineProvider } from "../context/OfflineContext";
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

// Stack navigators
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth navigator
const AuthNavigator = () => {
  const { theme } = useThemedStyles();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

// Main tab navigator
const MainTabNavigator = () => {
  const { theme, isDarkMode } = useThemedStyles();
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    tabBar: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.outlineVariant,
      borderTopWidth: 1,
      elevation: 8,
      height: Platform.OS === "ios" ? 88 : 65,
      paddingBottom: Platform.OS === "ios" ? 28 : 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
    },
    tabIcon: {
      marginTop: 4,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: "500",
      marginBottom: 4,
    },
  });

  return (
    <View style={styles.container}>
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

            return <Ionicons name={iconName} size={size} color={color} style={styles.tabIcon} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          headerShown: false,
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen name="Recordings" component={RecordingsListScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Downloads" component={DownloadsScreen} />
        <Tab.Screen name="Profile" component={ProfileSettingsScreen} />
      </Tab.Navigator>
      <OfflineIndicator />
    </View>
  );
};

// Main stack navigator that includes the tab navigator
const MainNavigator = () => {
  const { handleOfflineRedirect } = useContext(OfflineContext);
  const { theme, isDarkMode } = useThemedStyles();

  // Move handleOfflineRedirect to useEffect instead of calling during render
  useEffect(() => {
    handleOfflineRedirect();
  }, [handleOfflineRedirect]);

  const backgroundStyle = StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
  });

  return (
    <View style={backgroundStyle.screen}>
      <MainStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: "fade",
          gestureEnabled: true,
          gestureDirection: "horizontal",
          presentation: "card",
          animationTypeForReplace: "push",
          navigationBarColor: theme.colors.background,
          statusBarStyle: isDarkMode ? "light" : "dark",
        }}
      >
        <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
        <MainStack.Screen
          name="RecordingDetails"
          component={RecordingDetailsScreen}
          options={{
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <MainStack.Screen
          name="SpeciesDetails"
          component={SpeciesDetailsScreen}
          options={{
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <MainStack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <MainStack.Screen
          name="OfflineNotice"
          component={OfflineNoticeScreen}
          options={{
            presentation: "modal",
            gestureEnabled: true,
            animation: "slide_from_bottom",
            contentStyle: {
              backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.3)",
            },
          }}
        />
        <MainStack.Screen
          name="Profile"
          component={ProfileSettingsScreen}
          options={{
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <MainStack.Screen
          name="Downloads"
          component={DownloadsScreen}
          options={{
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </MainStack.Navigator>
    </View>
  );
};

// Root navigator that switches between auth and main flows
const AppNavigator = () => {
  const { state: authState } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const { theme } = useThemedStyles();
  const navTheme = isDarkMode ? navigationDarkTheme : navigationLightTheme;

  // Add background color to ensure no white flashes
  const backgroundStyle = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
  });

  return (
    <View style={backgroundStyle.container}>
      <NavigationContainer theme={navTheme}>
        <OfflineProvider>
          {authState.isLoading ? (
            <SplashScreen />
          ) : authState.userToken ? (
            <MainNavigator />
          ) : (
            <AuthNavigator />
          )}
        </OfflineProvider>
      </NavigationContainer>
    </View>
  );
};

export default AppNavigator;
