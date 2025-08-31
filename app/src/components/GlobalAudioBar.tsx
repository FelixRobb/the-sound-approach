import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useNavigationState, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutChangeEvent,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudio } from "../context/AudioContext";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { useGlobalAudioBar } from "../context/GlobalAudioBarContext";
import { NetworkContext } from "../context/NetworkContext";
import { getBestAudioUri } from "../lib/mediaUtils";
import { createThemedTextStyle } from "../lib/theme";
import type { RootStackParamList } from "../types";

const iconHitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

// Shared height value for the GlobalAudioBar
let globalAudioBarHeight = 0;
let globalAudioBarHeightCallbacks: Array<(height: number) => void> = [];

const updateGlobalAudioBarHeight = (height: number) => {
  globalAudioBarHeight = height;
  globalAudioBarHeightCallbacks.forEach((callback) => callback(height));
};

const subscribeToHeightChanges = (callback: (height: number) => void) => {
  globalAudioBarHeightCallbacks.push(callback);
  // Immediately call with current height
  callback(globalAudioBarHeight);

  // Return unsubscribe function
  return () => {
    globalAudioBarHeightCallbacks = globalAudioBarHeightCallbacks.filter((cb) => cb !== callback);
  };
};

/**
 * A global, sticky audio control bar that sits just above the bottom navigation bar (when present)
 * and persists across the entire application.
 */
const GlobalAudioBar: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useSharedValue(0);
  const [hasTabBar, setHasTabBar] = useState(false);

  // Slider state management following the same pattern as RecordingDetailsScreen
  const sliderProgress = useSharedValue(0);
  const sliderMin = useSharedValue(0);
  const sliderMax = useSharedValue(1);
  const [isSeeking, setIsSeeking] = useState(false);

  const {
    isPlaying,
    isLoading,
    currentRecording,
    position,
    duration,
    togglePlayPause,
    stopPlayback,
    seekTo,
  } = useAudio();

  const { isDownloaded, getDownloadPath } = useContext(DownloadContext);
  const { isConnected } = useContext(NetworkContext);
  const { isVisible, hideBar } = useGlobalAudioBar();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const navigationState = useNavigationState((state) => state);

  // Simplified animation values
  const translateY = useSharedValue(0);
  // Handle layout measurement
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    updateGlobalAudioBarHeight(height);
  }, []);

  // Stable callbacks to avoid recreating functions
  const handleDismiss = useCallback(() => {
    try {
      stopPlayback();
      hideBar();
    } catch (error) {
      console.error("Error during dismissal:", error);
    }
  }, [stopPlayback, hideBar]);

  // Much simpler gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow downward movement
      const newTranslateY = Math.max(0, event.translationY);
      translateY.value = newTranslateY;
    })
    .onEnd((event) => {
      if (event.translationY > 50) {
        // Dismiss gesture - continue from current position for smooth animation
        const currentY = Math.max(0, event.translationY);
        translateY.value = withTiming(200, {
          duration: Math.max(150, 300 * (1 - currentY / 200)), // Shorter duration if already partway down
        });
        runOnJS(handleDismiss)();
      } else {
        // Snap back
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Calculate dynamic positioning
  const baseTabBarHeight = 70;
  const safeAreaBottom = Math.max(insets.bottom, 8);

  // Small gap between audio bar and tab bar - consistent across platforms
  const gapBetweenAudioBarAndTabBar = 12;
  const baseBottomMargin = safeAreaBottom > 0 ? 0 : 5;

  const bottomPosition = useAnimatedStyle(() => {
    const interpolatedBottom = interpolate(
      slideAnim.value,
      [0, 1],
      [
        // When tab bar is present: base tab bar height + safe area + small gap
        baseTabBarHeight + safeAreaBottom + gapBetweenAudioBarAndTabBar,
        // When no tab bar: just safe area + base margin
        safeAreaBottom + baseBottomMargin,
      ],
      Extrapolation.CLAMP
    );
    return {
      bottom: interpolatedBottom,
    };
  });

  // Check if current screen has tab bar with safe error handling
  useEffect(() => {
    try {
      if (!navigationState) {
        const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
        const hasTab = tabScreens.includes(route.name);
        setHasTabBar(hasTab);
        return;
      }

      if (
        "routes" in navigationState &&
        "index" in navigationState &&
        Array.isArray(navigationState.routes) &&
        typeof navigationState.index === "number"
      ) {
        const currentRoute = navigationState.routes[navigationState.index];

        if (currentRoute?.name === "MainTabs") {
          setHasTabBar(true);
          return;
        }

        const tabScreens = ["Recordings", "Search", "Downloads", "Profile"];

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
        const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
        const hasTab = tabScreens.includes(route.name);
        setHasTabBar(hasTab);
      }
    } catch (error) {
      console.warn("Navigation state error in GlobalAudioBar:", error);
      const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
      const hasTab = tabScreens.includes(route.name);
      setHasTabBar(hasTab);
    }
  }, [navigationState, route.name]);

  useEffect(() => {
    if (!currentRecording) return;
    getBestAudioUri(currentRecording, isDownloaded, getDownloadPath, isConnected)
      .then(setAudioUri)
      .catch(() => {
        setAudioUri(null);
      });
  }, [currentRecording, isDownloaded, getDownloadPath, isConnected]);

  // Update slider values when duration changes
  useEffect(() => {
    if (duration > 0) {
      sliderMax.value = duration;
    }
  }, [duration, sliderMax]);

  // Update slider position when not seeking
  useEffect(() => {
    if (!isSeeking && duration > 0) {
      sliderProgress.value = position;
    }
    if (isLoading) {
      sliderProgress.value = 0;
    }
  }, [position, duration, isSeeking, sliderProgress, isLoading]);

  const handlePlayPause = () => {
    if (!audioUri || !currentRecording) return;
    togglePlayPause(currentRecording).catch(() => {});
  };

  const handleNavigateToDetails = () => {
    if (!currentRecording) return;
    navigation.navigate("RecordingDetails", { recordingId: currentRecording.id });
  };

  // Slider seeking logic
  const onSeekStart = () => {
    setIsSeeking(true);
  };

  const onSeekComplete = (value: number) => {
    if (!currentRecording || duration <= 0) return;

    try {
      seekTo(value);
      sliderProgress.value = value;
    } catch (error) {
      console.error("Error seeking audio:", error);
    } finally {
      const delay = 100;
      setTimeout(() => setIsSeeking(false), delay);
    }
  };

  const onValueChange = (value: number) => {
    if (isSeeking) {
      sliderProgress.value = value;
    }
  };

  // Animate position based on tab bar presence
  useEffect(() => {
    const targetValue = hasTabBar ? 0 : 1;
    setTimeout(() => {
      slideAnim.value = withSpring(targetValue, {
        damping: 20,
        stiffness: 300,
      });
    }, 100);
  }, [hasTabBar, slideAnim]);

  // Reset animation values when component becomes visible
  useEffect(() => {
    if (isVisible) {
      translateY.value = 0;
    }
  }, [isVisible, translateY]);

  // If we don't have a current recording or the bar is hidden, don't render
  if (!currentRecording || !isVisible) return null;

  const styles = StyleSheet.create({
    container: {
      elevation: 30,
      left: 12,
      position: "absolute",
      right: 12,
      zIndex: theme.zIndex.globalAudioBar,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    inner: {
      backgroundColor: theme.colors.globalAudioBar,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      elevation: 12,
      filter: "drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))",
      flexDirection: "column",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.7,
      shadowRadius: 16,
    },
    mainPlayButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      elevation: 2,
      height: 36,
      justifyContent: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      width: 36,
    },
    playIcon: {
      marginLeft: 2,
    },
    progressRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: theme.spacing.xs,
    },
    progressText: {
      ...createThemedTextStyle(theme, {
        size: "xs",
        weight: "medium",
        color: "onSurfaceVariant",
      }),
      fontVariant: ["tabular-nums"],
    },
    slider: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      height: 4,
      overflow: "hidden",
      width: "100%",
    },
    sliderThumb: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      elevation: 3,
      height: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      width: 16,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    title: {
      color: theme.colors.onSurface,
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "medium",
        color: "onSurface",
      }),
      marginBottom: theme.spacing.xs,
    },
    titleContainer: {
      flex: 1,
      minWidth: 0,
    },
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.container, bottomPosition, animatedContainerStyle]}
        onLayout={handleLayout}
      >
        <View style={styles.inner}>
          {/* Header Row with Title and Main Play Button */}
          <View style={styles.headerRow}>
            <Pressable
              style={styles.titleContainer}
              onPress={handleNavigateToDetails}
              hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
            >
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {currentRecording?.title ?? "Unknown Recording"}
              </Text>
              {currentRecording?.species && (
                <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  {currentRecording.species.common_name}
                  {currentRecording.species.scientific_name
                    ? ` • ${currentRecording.species.scientific_name}`
                    : ""}
                </Text>
              )}
            </Pressable>

            <TouchableOpacity
              hitSlop={iconHitSlop}
              onPress={handlePlayPause}
              style={styles.mainPlayButton}
              disabled={!audioUri}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size={20} color={theme.colors.onPrimary} />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color={theme.colors.onPrimary}
                  style={isPlaying ? undefined : styles.playIcon}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <Slider
            minimumValue={sliderMin}
            maximumValue={sliderMax}
            progress={sliderProgress}
            onSlidingStart={onSeekStart}
            onSlidingComplete={onSeekComplete}
            onValueChange={onValueChange}
            disableTapEvent
            thumbWidth={16}
            theme={{
              minimumTrackTintColor: theme.colors.primary,
              maximumTrackTintColor: theme.colors.surfaceVariant,
              bubbleBackgroundColor: theme.colors.tertiary,
              bubbleTextColor: theme.colors.onTertiary,
            }}
            containerStyle={styles.slider}
            disable={!currentRecording || duration <= 0}
            bubble={(value) => formatTime(value)}
            bubbleTextStyle={{
              ...createThemedTextStyle(theme, {
                size: "xs",
                weight: "medium",
                color: "onTertiary",
                lineHeight: "snug",
              }),
              fontVariant: ["tabular-nums"],
            }}
            renderThumb={() => <View style={styles.sliderThumb} />}
          />

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{formatTime(position)}</Text>
            <Text style={styles.progressText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * A hook that returns the height of the GlobalAudioBar with proper safe area and tab bar considerations.
 * This can be used to add margin to the bottom of screens to prevent content from being hidden behind the audio bar.
 */
export const useGlobalAudioBarHeight = (): number => {
  const { isVisible } = useGlobalAudioBar();
  const insets = useSafeAreaInsets();
  const [measuredHeight, setMeasuredHeight] = useState(globalAudioBarHeight);
  const route = useRoute();
  const navigationState = useNavigationState((state) => state);

  // Subscribe to height changes
  useEffect(() => {
    const unsubscribe = subscribeToHeightChanges(setMeasuredHeight);
    return unsubscribe;
  }, []);

  // Determine if current screen has tab bar (same logic as in GlobalAudioBar)
  const hasTabBar = useMemo(() => {
    try {
      if (!navigationState) {
        const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
        return tabScreens.includes(route.name);
      }

      if (
        "routes" in navigationState &&
        "index" in navigationState &&
        Array.isArray(navigationState.routes) &&
        typeof navigationState.index === "number"
      ) {
        const currentRoute = navigationState.routes[navigationState.index];

        if (currentRoute?.name === "MainTabs") {
          return true;
        }

        const tabScreens = ["Recordings", "Search", "Downloads", "Profile"];

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
          return tabScreens.includes(nestedRoute?.name || "");
        }

        return tabScreens.includes(currentRoute?.name || "");
      } else {
        const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
        return tabScreens.includes(route.name);
      }
    } catch (error) {
      console.warn("Navigation state error in useGlobalAudioBarHeight:", error);
      const tabScreens = ["Recordings", "Search", "Downloads", "Profile", "MainTabs"];
      return tabScreens.includes(route.name);
    }
  }, [navigationState, route.name]);

  // Calculate total height needed for proper spacing
  const totalHeight = useMemo(() => {
    if (!isVisible || measuredHeight === 0) return 0;

    // Base measured height of the audio bar
    let height = measuredHeight;

    // Add safe area considerations
    const safeAreaBottom = Math.max(insets.bottom, 8);

    if (hasTabBar) {
      // When tab bar is present, the audio bar sits above it
      // We need the audio bar height plus some spacing
      const gapBetweenAudioBarAndTabBar = 6;
      height = height + gapBetweenAudioBarAndTabBar;
    } else {
      // When no tab bar, audio bar sits at bottom with safe area
      height = height + safeAreaBottom;
    }

    return height;
  }, [isVisible, measuredHeight, insets.bottom, hasTabBar]);

  return totalHeight;
};

export default GlobalAudioBar;
