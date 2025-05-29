import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, View, Text, Animated } from "react-native";

import OfflineIndicator from "../components/OfflineIndicator";
import { NetworkContext } from "../context/NetworkContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import DownloadsScreen from "../screens/DownloadsScreen";
import OfflineNoticeScreen from "../screens/OfflineNoticeScreen";
import { OfflineStackParamList, RootStackParamList } from "../types";

// Stack navigator for offline mode
const OfflineStack = createNativeStackNavigator<OfflineStackParamList>();

// Offline mode navigator that only shows downloads and offline notice
const OfflineNavigator = () => {
  const { theme } = useThemedStyles();
  const { onNetworkRestore } = useContext(NetworkContext);
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  // Show notification when connection is restored
  useEffect(() => {
    const unsubscribe = onNetworkRestore(() => {
      setShowOnlineNotice(true);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 2 seconds and navigate back to main tabs
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowOnlineNotice(false);

          // Navigate back to MainTabs
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "MainTabs" as keyof RootStackParamList }],
            })
          );
        });
      }, 2000);
    });

    return unsubscribe;
  }, [navigation, onNetworkRestore, fadeAnim]);

  const backgroundStyle = StyleSheet.create({
    onlineNotice: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      elevation: 5,
      flexDirection: "row",
      left: 20,
      padding: 16,
      position: "absolute",
      right: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      top: 80,
      zIndex: 10,
    },
    onlineNoticeText: {
      color: theme.colors.onPrimaryContainer,
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 12,
    },
    screen: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
  });

  return (
    <View style={backgroundStyle.screen}>
      {showOnlineNotice && (
        <Animated.View style={[backgroundStyle.onlineNotice, { opacity: fadeAnim }]}>
          <Ionicons name="wifi" size={24} color={theme.colors.primary} />
          <Text style={backgroundStyle.onlineNoticeText}>
            Your connection has been restored! Transitioning to online mode...
          </Text>
        </Animated.View>
      )}

      <OfflineStack.Navigator
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
        <OfflineStack.Screen name="Downloads" component={DownloadsScreen} />
        <OfflineStack.Screen
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
      </OfflineStack.Navigator>
      <OfflineIndicator />
    </View>
  );
};

export default OfflineNavigator;
