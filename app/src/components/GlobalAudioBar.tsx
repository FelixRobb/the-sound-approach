import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useNavigationState, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudio } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { useGlobalAudioBar } from "../context/GlobalAudioBarContext";
import { NetworkContext } from "../context/NetworkContext";
import { getBestAudioUri } from "../lib/mediaUtils";
import { createThemedTextStyle } from "../lib/theme";
import type { RootStackParamList } from "../types";

const iconHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

/**
 * A global, sticky audio control bar that sits just above the bottom navigation bar (when present)
 * and persists across the entire application.
 */
const GlobalAudioBar: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [hasTabBar, setHasTabBar] = useState(false);

  const {
    isPlaying,
    isLoading,
    currentRecording,
    position,
    duration,
    togglePlayPause,
    skipForward,
    skipBackward,
    stopPlayback,
  } = useAudio();

  const { isDownloaded, getDownloadPath } = useContext(DownloadContext);
  const { isConnected } = useContext(NetworkContext);
  const { isVisible } = useGlobalAudioBar();

  // Safe navigation state getter with error handling
  const navigationState = useNavigationState((state) => state);

  // Check if current screen has tab bar with safe error handling
  useEffect(() => {
    try {
      if (!navigationState) {
        // Fallback: use route name to determine if we're on a tab screen
        const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
        const hasTab = tabScreens.includes(route.name);
        setHasTabBar(hasTab);
        return;
      }

      // Type guard to ensure navigationState has expected properties
      if (
        "routes" in navigationState &&
        "index" in navigationState &&
        Array.isArray(navigationState.routes) &&
        typeof navigationState.index === "number"
      ) {
        // Get the current route
        const currentRoute = navigationState.routes[navigationState.index];

        // Check if we're in the MainTabs navigator
        if (currentRoute?.name === "MainTabs") {
          setHasTabBar(true);
          return;
        }

        // Check if we're on any tab screen specifically
        const tabScreens = ["Recordings", "Search", "Downloads", "Profile"];

        // For nested navigation, check the nested state
        if (
          currentRoute?.state &&
          "routes" in currentRoute.state &&
          "index" in currentRoute.state
        ) {
          const nestedState = currentRoute.state as {
            routes: RouteProp<RootStackParamList>[];
            index: number;
          };
          const nestedRoute = nestedState.routes[nestedState.index];
          const hasTab = tabScreens.includes(nestedRoute?.name || "");
          setHasTabBar(hasTab);
          return;
        }

        const hasTab = tabScreens.includes(currentRoute?.name || "");
        setHasTabBar(hasTab);
      } else {
        // Fallback if navigationState doesn't have expected structure
        const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
        const hasTab = tabScreens.includes(route.name);
        setHasTabBar(hasTab);
      }
    } catch (error) {
      // Fallback: assume no tab bar on error and use route name
      console.warn("Navigation state error in GlobalAudioBar:", error);
      const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
      const hasTab = tabScreens.includes(route.name);
      setHasTabBar(hasTab);
    }
  }, [navigationState, route.name]);

  const [audioUri, setAudioUri] = useState<string | null>(null);
  useEffect(() => {
    if (!currentRecording) return;
    getBestAudioUri(currentRecording, isDownloaded, getDownloadPath, isConnected)
      .then(setAudioUri)
      .catch(() => {
        setAudioUri(null);
      });
  }, [currentRecording, isDownloaded, getDownloadPath, isConnected]);

  // Animate position based on tab bar presence
  useEffect(() => {
    const targetValue = hasTabBar ? 0 : 1;

    Animated.spring(slideAnim, {
      toValue: targetValue,
      useNativeDriver: false, // We're animating position which requires layout
      tension: 100,
      friction: 8,
      velocity: 0.4,
      delay: hasTabBar ? 0 : 150, // Small delay when moving down to avoid jarring transition
    }).start();
  }, [hasTabBar, slideAnim]);

  // If we don't have a current recording or the bar is hidden, don't render the bar
  if (!currentRecording || !isVisible) return null;

  const handlePlayPause = () => {
    if (!audioUri || !currentRecording) return;
    togglePlayPause(currentRecording).catch(() => {});
  };

  const handleNavigateToDetails = () => {
    if (!currentRecording) return;
    navigation.navigate("RecordingDetails", { recordingId: currentRecording.id });
  };

  // Calculate dynamic positioning
  const tabBarHeight = 70; // Should match your tab bar height
  const safeAreaBottom = Math.max(insets.bottom, 8);
  const baseBottomMargin = safeAreaBottom > 0 ? 0 : 5;

  // Interpolate the bottom position
  const bottomPosition = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      safeAreaBottom + tabBarHeight + baseBottomMargin, // Above tab bar
      safeAreaBottom + baseBottomMargin, // At bottom when no tab bar
    ],
  });

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      left: 16,
      right: 16,
      zIndex: 999,
      elevation: 30,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.lg,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      // Add subtle blur effect on iOS
      ...(Platform.OS === "ios" && {
        backgroundColor: `${theme.colors.surface}F8`,
      }),
    },
    infoContainer: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
      minWidth: 0, // Prevent text overflow issues
    },
    title: {
      color: theme.colors.onSurface,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurface",
      }),
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    controlButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.sm,
    },
    progressBar: {
      width: 80,
      height: theme.spacing.xs,
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: 1,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
    },
    separator: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: theme.spacing.sm,
      opacity: 0.5,
    },
    playIcon: {
      marginLeft: theme.spacing.xs,
    },
    progressText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "tertiary",
      }),
      marginTop: theme.spacing.xs,
      fontVariant: ["tabular-nums"], // Monospace numbers for stable width
    },
  });

  const ProgressText = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        {formatTime(position)} / {formatTime(duration)}
      </Text>
      {/* Optional: Add a small progress indicator */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
        },
      ]}
    >
      <Pressable onPress={handleNavigateToDetails}>
        <View style={styles.inner}>
          {/* Play / pause */}
          <TouchableOpacity
            hitSlop={iconHitSlop}
            onPress={handlePlayPause}
            style={styles.controlButton}
            disabled={!audioUri}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size={22} color={theme.colors.primary} />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={22}
                color={audioUri ? theme.colors.primary : theme.colors.onSurfaceVariant}
                style={isPlaying ? undefined : styles.playIcon}
              />
            )}
          </TouchableOpacity>

          {/* Backward 10s */}
          <TouchableOpacity
            hitSlop={iconHitSlop}
            onPress={() => skipBackward(10)}
            style={styles.controlButton}
            disabled={!currentRecording}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-back"
              size={20}
              color={currentRecording ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {/* Forward 10s */}
          <TouchableOpacity
            hitSlop={iconHitSlop}
            onPress={() => skipForward(10)}
            style={styles.controlButton}
            disabled={!currentRecording}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-forward"
              size={20}
              color={currentRecording ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {/* Stop */}
          <TouchableOpacity
            hitSlop={iconHitSlop}
            onPress={stopPlayback}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <Ionicons name="stop" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* Visual separator */}
          <View style={styles.separator} />

          {/* Info */}
          <View style={styles.infoContainer} pointerEvents="none">
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {currentRecording?.title ?? "Unknown Recording"}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {currentRecording?.species?.common_name}
              {currentRecording?.species?.scientific_name
                ? ` – ${currentRecording.species.scientific_name}`
                : ""}
            </Text>
            <ProgressText />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
/**
 * A hook that returns the height of the GlobalAudioBar.
 * This can be used to add margin to the bottom of screens to prevent content from being hidden behind the audio bar.
 */
export const useGlobalAudioBarHeight = (): number => {
  const insets = useSafeAreaInsets();
  const { isVisible } = useGlobalAudioBar();
  const barHeight = 64; // Base height of the audio bar
  const bottomInset = insets.bottom;
  const totalHeight = isVisible ? barHeight + bottomInset : 0;

  return totalHeight;
};

/**
 * @deprecated Use useGlobalAudioBarHeight hook instead for better React compliance
 * A component that returns the height of the GlobalAudioBar.
 * This can be used to add margin to the bottom of screens to prevent content from being hidden behind the audio bar.
 */
export const GlobalAudioBarHeight = (): number => {
  const insets = useSafeAreaInsets();
  const { isVisible } = useGlobalAudioBar();
  const barHeight = 64; // Base height of the audio bar
  const bottomInset = insets.bottom;
  const totalHeight = isVisible ? barHeight + bottomInset : 0;

  return totalHeight;
};

export default GlobalAudioBar;
