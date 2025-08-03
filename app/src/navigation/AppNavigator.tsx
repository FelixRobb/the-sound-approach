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

import GlobalAudioBar from "../components/GlobalAudioBar";
import { AudioProvider } from "../context/AudioContext";
import { AuthContext } from "../context/AuthContext";
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

type AnimatedTabButtonProps = React.PropsWithChildren<{
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
}>;

const animatedTabButtonStyles = StyleSheet.create({
  animatedView: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 4,
    paddingVertical: 8,
  },
  button: {
    flex: 1,
  },
  opacitySelected: {
    opacity: 1,
  },
  opacityUnselected: {
    opacity: 0.7,
  },
});

const AnimatedTabButton: React.FC<AnimatedTabButtonProps> = ({
  children,
  onPress,
  accessibilityState,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSelected = accessibilityState?.selected;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 200,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 7,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedTabButtonStyles.button}
      android_ripple={{ color: "transparent" }}
    >
      <Animated.View
        style={[
          animatedTabButtonStyles.animatedView,
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
  theme: {
    colors: {
      primary: string;
      onSurfaceVariant: string;
      surface: string;
      shadow: string;
    };
  };
};

const animatedTabIconStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ focused, iconName, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim]);

  return (
    <View style={animatedTabIconStyles.container}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Ionicons name={iconName} size={24} color={color} />
      </Animated.View>
    </View>
  );
};

type AnimatedTabLabelProps = React.PropsWithChildren<{
  focused: boolean;
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
  },
  labelFocused: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelUnfocused: {
    fontSize: 12,
    fontWeight: "500",
  },
});

const AnimatedTabLabel: React.FC<AnimatedTabLabelProps> = ({ focused, children, theme }) => {
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0.7,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, opacityAnim]);

  return (
    <Animated.Text
      style={[
        animatedTabLabelStyles.label,
        focused ? animatedTabLabelStyles.labelFocused : animatedTabLabelStyles.labelUnfocused,
        {
          color: focused ? theme.colors.primary : theme.colors.onSurfaceVariant,
          opacity: opacityAnim,
        },
      ]}
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    // eslint-disable-next-line react-native/no-color-literals
    tabBar: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      borderTopWidth: 0,
      elevation: 18,
      height: Platform.OS === "ios" ? 90 : 70,
      paddingBottom: Platform.OS === "ios" ? 26 : 10,
      paddingHorizontal: 8,
      paddingTop: 10,
      shadowColor: "000",
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
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
              <AnimatedTabIcon focused={focused} iconName={iconName} color={color} theme={theme} />
            );
          },
          animation: "shift",
          tabBarLabel: ({ focused, children }) => (
            <AnimatedTabLabel focused={focused} theme={theme}>
              {children}
            </AnimatedTabLabel>
          ),
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
          animationDuration: 300,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: styles.tabBar,
        })}
      >
        <Tab.Screen name="Recordings" component={RecordingsListScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Downloads" component={DownloadsScreen} />
        <Tab.Screen name="Profile" component={ProfileSettingsScreen} />
      </Tab.Navigator>
    </View>
  );
};

// Main stack navigator that includes the tab navigator
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
        <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
        {/* Shared detail screens – mounted once for the whole app */}
        <MainStack.Screen name="RecordingDetails" component={RecordingDetailsScreen} />
        <MainStack.Screen name="SpeciesDetails" component={SpeciesDetailsScreen} />
        <MainStack.Screen
          name="DownloadsManager"
          component={DownloadsScreen}
          options={{
            presentation: "card",
            gestureEnabled: true,
            animation: "slide_from_right",
          }}
        />
        <MainStack.Screen
          name="DeleteAccount"
          component={DeleteAccountScreen}
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
      <View style={backgroundStyle.container}>
        <NavigationContainer theme={navTheme}>
          {navigatorToShow}
          <GlobalAudioBar />
        </NavigationContainer>
      </View>
    </AudioProvider>
  );
};

export default AppNavigator;
