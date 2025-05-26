"use client";

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { useContext, useEffect } from "react";
import { Platform, Text, View, StyleSheet } from "react-native";

import OfflineIndicator from "../components/OfflineIndicator";
import { AudioProvider } from "../context/AudioContext";
import { AuthContext } from "../context/AuthContext";
import { NetworkContext } from "../context/NetworkContext";
import { OfflineContext, OfflineProvider } from "../context/OfflineContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import OfflineNavigator from "../navigation/OfflineNavigator";
import DownloadsScreen from "../screens/DownloadsScreen";
import LoginScreen from "../screens/LoginScreen";
import OfflineNoticeScreen from "../screens/OfflineNoticeScreen";
import ProfileSettingsScreen from "../screens/ProfileSettingsScreen";
import RecordingDetailsScreen from "../screens/RecordingDetailsScreen";
import RecordingsListScreen from "../screens/RecordingsListScreen";
import SearchScreen from "../screens/SearchScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SpeciesDetailsScreen from "../screens/SpeciesDetailsScreen";
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
        contentStyle: { backgroundColor: theme.colors.background },
        animation: "fade",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
        animationTypeForReplace: "push",
        navigationBarColor: theme.colors.background,
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
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    activeLabel: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    container: {
      flex: 1,
    },
    iconContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    inactiveLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    tabBar: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: 0,
      elevation: 12,
      height: Platform.OS === "ios" ? 88 : 68,
      paddingBottom: Platform.OS === "ios" ? 24 : 8,
      paddingTop: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -14 },
      shadowOpacity: 0.8,
      shadowRadius: 18,
    },
    tabItem: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingVertical: 4,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "ellipse";

            switch (route.name) {
              case "Recordings":
                iconName = focused ? "musical-notes" : "musical-notes-outline";
                break;
              case "Search":
                iconName = focused ? "search" : "search-outline";
                break;
              case "Downloads":
                iconName = focused ? "download" : "download-outline";
                break;
              case "Profile":
                iconName = focused ? "person" : "person-outline";
                break;
            }

            return (
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
              </View>
            );
          },
          tabBarLabel: ({ focused, children }) => (
            <Text style={[styles.tabLabel, focused ? styles.activeLabel : styles.inactiveLabel]}>
              {children}
            </Text>
          ),
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: styles.tabBar,
          animation: "shift",
          animationTypeForReplace: "push",
          animationDuration: 300,
          tabBarItemStyle: styles.tabItem,
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
  const { theme } = useThemedStyles();
  const { isConnected } = useContext(NetworkContext);

  // Redirect to Downloads when going offline
  useEffect(() => {
    if (!isConnected) {
      handleOfflineRedirect();
    }
  }, [isConnected, handleOfflineRedirect]);

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
              backgroundColor: theme.colors.background,
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
  const { isConnected } = useContext(NetworkContext);
  const { theme, isDarkMode } = useThemedStyles();
  const navTheme = isDarkMode ? navigationDarkTheme : navigationLightTheme;

  // Effect to hide the splash screen once auth state is determined
  useEffect(() => {
    const hideSplash = async () => {
      if (authState.userToken !== undefined) {
        await SplashScreen.hideAsync();
      }
    };
    hideSplash();
  }, [authState.userToken]); // Rerun when auth state changes

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
        <AudioProvider>
          <OfflineProvider>
            {authState.userToken ? ( // Directly check authState
              isConnected ? (
                <MainNavigator />
              ) : (
                <OfflineNavigator />
              )
            ) : (
              <AuthNavigator />
            )}
          </OfflineProvider>
        </AudioProvider>
      </NavigationContainer>
    </View>
  );
};

export default AppNavigator;
