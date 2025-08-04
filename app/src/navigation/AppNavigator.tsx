import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { useContext, useEffect, useRef } from "react";
import {
  Platform,
  View,
  StyleSheet,
  Animated,
  Pressable,
  GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GlobalAudioBar from "../components/GlobalAudioBar";
import { AudioProvider } from "../context/AudioContext";
import { AuthContext } from "../context/AuthContext";
import { GlobalAudioBarProvider } from "../context/GlobalAudioBarContext";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import OfflineNavigator from "../navigation/OfflineNavigator";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import DownloadsScreen from "../screens/DownloadsScreen";
import LoginScreen from "../screens/LoginScreen";
import OfflineWelcomeScreen from "../screens/OfflineWelcomeScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import ProfileSettingsScreen from "../screens/ProfileSettingsScreen";
import RecordingDetailsScreen from "../screens/RecordingDetailsScreen";
import RecordingsListScreen from "../screens/RecordingsListScreen";
import SearchScreen from "../screens/SearchScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SpeciesDetailsScreen from "../screens/SpeciesDetailsScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import { navigationDarkTheme, navigationLightTheme } from "../theme";

// Higher-order component that wraps screens with GlobalAudioBar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withGlobalAudioBar = (WrappedComponent: React.ComponentType<any>) => {
  return (props: React.ComponentProps<typeof WrappedComponent>) => (
    <View style={styles.container}>
      <WrappedComponent {...props} />
      <GlobalAudioBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type AnimatedTabButtonProps = React.PropsWithChildren<{
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
  isLargeScreen?: boolean;
}>;

const animatedTabButtonStyles = StyleSheet.create({
  animatedView: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 6,
    paddingVertical: 10,
    minHeight: 48, // Ensure minimum touch target
  },
  animatedViewLarge: {
    borderRadius: 24,
    marginHorizontal: 8,
    paddingVertical: 12,
    minHeight: 56,
  },
  button: {
    flex: 1,
  },
  opacitySelected: {
    opacity: 1,
  },
  opacityUnselected: {
    opacity: 0.75,
  },
});

const AnimatedTabButton: React.FC<AnimatedTabButtonProps> = ({
  children,
  onPress,
  accessibilityState,
  isLargeScreen = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSelected = accessibilityState?.selected;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedTabButtonStyles.button}
      android_ripple={{
        color: "rgba(0,0,0,0.1)",
        borderless: true,
        radius: isLargeScreen ? 32 : 28,
      }}
      // Improve accessibility
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
    >
      <Animated.View
        style={[
          animatedTabButtonStyles.animatedView,
          isLargeScreen && animatedTabButtonStyles.animatedViewLarge,
          isSelected
            ? animatedTabButtonStyles.opacitySelected
            : animatedTabButtonStyles.opacityUnselected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

type AnimatedTabIconProps = {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
};

const animatedTabIconStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  focused,
  iconName,
  color,
  size = 24,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Icon scale animation
    Animated.timing(scaleAnim, {
      toValue: focused ? 1.15 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Subtle glow effect for focused state
    Animated.timing(glowAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim, glowAnim]);

  return (
    <View style={animatedTabIconStyles.container}>
      <Animated.View
        style={[
          animatedTabIconStyles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.9],
            }),
          },
        ]}
      >
        <Ionicons name={iconName} size={size} color={color} />
      </Animated.View>
    </View>
  );
};

// Updated AnimatedTabLabel with responsive text sizing
type AnimatedTabLabelProps = React.PropsWithChildren<{
  focused: boolean;
  isLargeScreen?: boolean;
  theme: {
    colors: {
      primary: string;
      onSurfaceVariant: string;
    };
  };
  children: React.ReactNode;
}>;

const animatedTabLabelStyles = StyleSheet.create({
  label: {
    textAlign: "center",
    marginTop: 2,
  },
  labelFocused: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelFocusedLarge: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelUnfocused: {
    fontSize: 12,
    fontWeight: "500",
  },
  labelUnfocusedLarge: {
    fontSize: 13,
    fontWeight: "500",
  },
});

const AnimatedTabLabel: React.FC<AnimatedTabLabelProps> = ({
  focused,
  children,
  theme,
  isLargeScreen = false,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.7)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.75,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: focused ? -1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, opacityAnim, translateYAnim]);

  const labelStyle = focused
    ? isLargeScreen
      ? animatedTabLabelStyles.labelFocusedLarge
      : animatedTabLabelStyles.labelFocused
    : isLargeScreen
      ? animatedTabLabelStyles.labelUnfocusedLarge
      : animatedTabLabelStyles.labelUnfocused;

  return (
    <Animated.Text
      style={[
        animatedTabLabelStyles.label,
        labelStyle,
        {
          color: focused ? theme.colors.primary : theme.colors.onSurfaceVariant,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit={true}
      minimumFontScale={0.8}
    >
      {children}
    </Animated.Text>
  );
};

// Stack navigators
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth navigator
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
        animationTypeForReplace: "push",
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

// Onboarding navigator - separate from auth flow
const OnboardingNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: false, // Prevent going back during onboarding
        presentation: "card",
      }}
    >
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    </AuthStack.Navigator>
  );
};

// Simple Main tab navigator with custom animations
const MainTabNavigator: React.FC = () => {
  const { theme } = useThemedStyles();
  const insets = useSafeAreaInsets();

  const baseTabBarHeight = 60;
  const totalTabBarHeight = baseTabBarHeight + insets.bottom;
  const isLargeScreen = totalTabBarHeight > 85;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    tabBar: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 0,
      elevation: 20,
      shadowColor: theme.colors.shadow || "#000000",
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      paddingHorizontal: Math.max(12, insets.left, insets.right),
      paddingBottom: Math.max(insets.bottom, 8),
      paddingTop: isLargeScreen ? 16 : 12,
      height: totalTabBarHeight,
      ...(Platform.OS === "ios" && {
        backgroundColor: `${theme.colors.surface}F0`, // Semi-transparent
        backdropFilter: "blur(20px)",
      }),
    },
    tabBarSafeArea: {
      paddingBottom: Math.max(insets.bottom - 4, 0),
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
              <AnimatedTabIcon
                focused={focused}
                iconName={iconName}
                color={color}
                size={isLargeScreen ? 26 : 24}
              />
            );
          },
          animation: "shift",
          tabBarLabel: ({ focused, children }) => (
            <AnimatedTabLabel focused={focused} theme={theme} isLargeScreen={isLargeScreen}>
              {children}
            </AnimatedTabLabel>
          ),
          tabBarButton: (props) => <AnimatedTabButton {...props} isLargeScreen={isLargeScreen} />,
          animationDuration: 250,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: [styles.tabBar, insets.bottom > 30 && styles.tabBarSafeArea],
          tabBarAccessibilityLabel: `${route.name} tab`,
          tabBarTestID: `${route.name.toLowerCase()}-tab`,
        })}
      >
        <Tab.Screen
          name="Recordings"
          component={RecordingsListScreen}
          options={{
            tabBarLabel: "Recordings",
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarLabel: "Search",
          }}
        />
        <Tab.Screen
          name="Downloads"
          component={DownloadsScreen}
          options={{
            tabBarLabel: "Downloads",
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileSettingsScreen}
          options={{
            tabBarLabel: "Profile",
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const MainNavigator: React.FC = () => {
  const backgroundStyle = StyleSheet.create({
    screen: {
      flex: 1,
    },
  });

  return (
    <View style={backgroundStyle.screen}>
      <MainStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
          gestureEnabled: true,
          gestureDirection: "horizontal",
          presentation: "card",
          animationTypeForReplace: "push",
        }}
      >
        <MainStack.Screen name="MainTabs" component={withGlobalAudioBar(MainTabNavigator)} />
        {/* Shared detail screens – mounted once for the whole app */}
        <MainStack.Screen
          name="RecordingDetails"
          component={withGlobalAudioBar(RecordingDetailsScreen)}
        />
        <MainStack.Screen
          name="SpeciesDetails"
          component={withGlobalAudioBar(SpeciesDetailsScreen)}
        />
        <MainStack.Screen
          name="DownloadsManager"
          component={withGlobalAudioBar(DownloadsScreen)}
          options={{
            presentation: "card",
            gestureEnabled: true,
            animation: "slide_from_right",
          }}
        />
        <MainStack.Screen
          name="DeleteAccount"
          component={withGlobalAudioBar(DeleteAccountScreen)}
          options={{
            presentation: "card",
            gestureEnabled: true,
            animation: "slide_from_right",
          }}
        />
      </MainStack.Navigator>
    </View>
  );
};

const OfflineAuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: false, // Disable gestures when offline
        presentation: "card",
      }}
    >
      <AuthStack.Screen name="Welcome" component={OfflineWelcomeScreen} />
    </AuthStack.Navigator>
  );
};

// Root navigator that switches between auth and main flows
const AppNavigator: React.FC = () => {
  const { state: authState } = useContext(AuthContext);
  const { isConnected } = useContext(NetworkContext);
  const { theme, isDarkMode } = useThemedStyles();
  const navTheme = isDarkMode ? navigationDarkTheme : navigationLightTheme;

  const backgroundStyle = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  useEffect(() => {
    const setNavigationBarColor = async () => {
      if (Platform.OS === "android") {
        try {
          await NavigationBar.setBackgroundColorAsync(theme.colors.surface);
          if (isDarkMode) {
            await NavigationBar.setButtonStyleAsync("light");
          } else {
            await NavigationBar.setButtonStyleAsync("dark");
          }
        } catch (error) {
          console.warn("Failed to set navigation bar color:", error);
        }
      }
    };

    setNavigationBarColor();
  }, [theme.colors.surface, isDarkMode]);

  useEffect(() => {
    const hideSplash = async () => {
      if (!authState.isLoading && authState.userToken !== undefined) {
        await SplashScreen.hideAsync();
      }
    };
    hideSplash();
  }, [authState.isLoading, authState.userToken]);

  // Determine which navigator to show
  const getNavigatorToShow = () => {
    // Ensure we have stable state before making navigation decisions
    if (authState.isLoading) {
      return null; // This will be handled by the loading check above
    }

    if (authState.userToken) {
      // User is authenticated
      if (isConnected) {
        // Online authenticated user
        if (!authState.hasCompletedOnboarding) {
          return <OnboardingNavigator />;
        } else {
          return <MainNavigator />;
        }
      } else {
        // Offline authenticated user
        // Show onboarding even in offline mode if not completed
        if (!authState.hasCompletedOnboarding) {
          return <OnboardingNavigator />;
        } else {
          return <OfflineNavigator />;
        }
      }
    } else {
      // User is not authenticated
      if (isConnected) {
        return <AuthNavigator />;
      } else {
        return <OfflineAuthNavigator />;
      }
    }
  };

  // Show loading screen while auth is loading
  if (authState.isLoading) {
    return <View style={backgroundStyle.container} />;
  }

  const navigatorToShow = getNavigatorToShow();

  // Additional safety check
  if (!navigatorToShow) {
    return <View style={backgroundStyle.container} />;
  }

  return (
    <AudioProvider>
      <GlobalAudioBarProvider>
        <View style={backgroundStyle.container}>
          <NavigationContainer theme={navTheme}>{navigatorToShow}</NavigationContainer>
        </View>
      </GlobalAudioBarProvider>
    </AudioProvider>
  );
};

export default AppNavigator;
