import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute, NavigationContainer } from "@react-navigation/native";
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
const RecordingsStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const DownloadsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

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

// Recordings stack navigator
const RecordingsNavigator: React.FC = () => {
  return (
    <RecordingsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
        animationTypeForReplace: "push",
      }}
    >
      <RecordingsStack.Screen name="RecordingsList" component={RecordingsListScreen} />
      <RecordingsStack.Screen name="RecordingDetails" component={RecordingDetailsScreen} />
      <RecordingsStack.Screen name="SpeciesDetails" component={SpeciesDetailsScreen} />
    </RecordingsStack.Navigator>
  );
};

// Search stack navigator
const SearchNavigator: React.FC = () => {
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
        animationTypeForReplace: "push",
      }}
    >
      <SearchStack.Screen name="SearchMain" component={SearchScreen} />
      <SearchStack.Screen name="RecordingDetails" component={RecordingDetailsScreen} />
      <SearchStack.Screen name="SpeciesDetails" component={SpeciesDetailsScreen} />
    </SearchStack.Navigator>
  );
};

// Downloads stack navigator
const DownloadsNavigator: React.FC = () => {
  return (
    <DownloadsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
        animationTypeForReplace: "push",
      }}
    >
      <DownloadsStack.Screen name="DownloadsList" component={DownloadsScreen} />
      <DownloadsStack.Screen name="RecordingDetails" component={RecordingDetailsScreen} />
    </DownloadsStack.Navigator>
  );
};

// Profile stack navigator
const ProfileNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
        animationTypeForReplace: "push",
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileSettingsScreen} />
      <DownloadsStack.Screen name="DownloadsList" component={DownloadsScreen} />
    </ProfileStack.Navigator>
  );
};

// Simple Main tab navigator with custom animations
const MainTabNavigator: React.FC = () => {
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -16 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
    },
    tabBar: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      borderTopWidth: 0,
      elevation: 16,
      height: Platform.OS === "ios" ? 90 : 70,
      paddingBottom: Platform.OS === "ios" ? 26 : 10,
      paddingHorizontal: 8,
      paddingTop: 10,
    },
  });

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route);

          return {
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
                  theme={theme}
                />
              );
            },
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
            tabBarStyle: {
              ...styles.tabBar,
              display:
                routeName === "RecordingDetails" || routeName === "SpeciesDetails"
                  ? "none"
                  : "flex",
            },
          };
        }}
      >
        <Tab.Screen name="Recordings" component={RecordingsNavigator} />
        <Tab.Screen name="Search" component={SearchNavigator} />
        <Tab.Screen name="Downloads" component={DownloadsNavigator} />
        <Tab.Screen name="Profile" component={ProfileNavigator} />
      </Tab.Navigator>
      <OfflineIndicator />
    </View>
  );
};

// Main stack navigator that includes the tab navigator
const MainNavigator: React.FC = () => {
  const { handleOfflineRedirect } = useContext(OfflineContext);
  const { isConnected } = useContext(NetworkContext);

  useEffect(() => {
    if (!isConnected) {
      handleOfflineRedirect();
    }
  }, [isConnected, handleOfflineRedirect]);

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
        <MainStack.Screen
          name="OfflineNotice"
          component={OfflineNoticeScreen}
          options={{
            presentation: "modal",
            gestureEnabled: true,
            animation: "slide_from_bottom",
          }}
        />
      </MainStack.Navigator>
    </View>
  );
};

// Root navigator that switches between auth and main flows
const AppNavigator: React.FC = () => {
  const { state: authState } = useContext(AuthContext);
  const { isConnected } = useContext(NetworkContext);
  const { theme, isDarkMode } = useThemedStyles();
  const navTheme = isDarkMode ? navigationDarkTheme : navigationLightTheme;

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

  const backgroundStyle = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={backgroundStyle.container}>
      <NavigationContainer theme={navTheme}>
        <AudioProvider>
          <OfflineProvider>
            {authState.userToken ? (
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
