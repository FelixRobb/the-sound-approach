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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

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
  // Gating to avoid jump after seek: hold slider at target until audio catches up
  const seekTarget = useSharedValue<number | null>(null);
  const awaitingCatchUp = useSharedValue(0); // 1 when waiting for position to reach seek target
  const isSeekingRef = useSharedValue(0); // shared gate to avoid async state races while dragging
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

  // Animation values - start from hidden position for slide-in effect
  const translateY = useSharedValue(120);
  // Handle layout measurement
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    updateGlobalAudioBarHeight(height);
  }, []);

  // Stable callbacks to avoid recreating functions
  const handleDismiss = useCallback(() => {
    try {
      void stopPlayback();
      hideBar();
    } catch (error) {
      console.error("Error during dismissal:", error);
    }
  }, [stopPlayback, hideBar]);

  // Pan gesture handler for dismissing the audio bar
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow downward movement
      const newTranslateY = Math.max(0, event.translationY);
      translateY.value = newTranslateY;
    })
    .onEnd((event) => {
      if (event.translationY > 50) {
        // Dismiss gesture - animate to fully hidden position
        const currentY = Math.max(0, event.translationY);
        const dismissDistance = 120; // Consistent with slide-in distance
        translateY.value = withTiming(dismissDistance, {
          duration: Math.max(150, 300 * (1 - currentY / dismissDistance)), // Shorter duration if already partway down
        });
        scheduleOnRN(handleDismiss);
      } else {
        // Snap back to visible position
        translateY.value = withSpring(0);
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
  const baseBottomMargin = 10 + (safeAreaBottom > 0 ? 0 : 5);
  const POSITION_EPSILON = 0.3; // seconds threshold to consider position caught up

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

  const handlePlayPause = () => {
    if (!audioUri || !currentRecording) return;
    togglePlayPause(currentRecording).catch(() => {});
  };

  const handleNavigateToDetails = () => {
    if (!currentRecording) return;
    navigation.navigate("RecordingDetails", { recordingId: currentRecording.id });
  };

  // Update slider position when not seeking
  useEffect(() => {
    if (duration <= 0) return;
    if (isSeeking || isSeekingRef.value) return;

    // If we're waiting for the player position to catch up to the seek target, hold steady
    if (awaitingCatchUp.value) {
      const target = seekTarget.value;
      if (target === null) {
        // Safety: if no target, stop gating and sync to position
        awaitingCatchUp.value = 0;
        sliderProgress.value = position;
        return;
      }
      const distance = Math.abs(position - target);
      if (distance <= POSITION_EPSILON) {
        // Caught up: release the gate and follow position again
        awaitingCatchUp.value = 0;
        seekTarget.value = null;
        sliderProgress.value = position;
      } else {
        // Keep the slider at the seek target until we catch up
        if (Math.abs(sliderProgress.value - target) > 0.001) {
          sliderProgress.value = target;
        }
      }
      return;
    }

    // Normal syncing when not seeking and not awaiting catch-up
    sliderProgress.value = position;
  }, [position, duration, isSeeking, sliderProgress, awaitingCatchUp, seekTarget, isSeekingRef]);

  // Update slider values when duration changes
  useEffect(() => {
    if (duration > 0) {
      sliderMax.value = duration;
      // Ensure progress never exceeds duration when it updates
      if (sliderProgress.value > duration) {
        sliderProgress.value = duration;
      }
      // Clamp seek target if currently set
      if (seekTarget.value !== null && seekTarget.value > duration) {
        seekTarget.value = duration;
      }
    }
  }, [duration, sliderMax, sliderProgress, seekTarget]);

  // Reset gating when recording changes
  useEffect(() => {
    awaitingCatchUp.value = 0;
    seekTarget.value = null;
    isSeekingRef.value = 0;
    setIsSeeking(false);
  }, [currentRecording?.id, awaitingCatchUp, seekTarget, isSeekingRef]);

  // Slider seeking logic
  const onSeekStart = () => {
    isSeekingRef.value = 1;
    awaitingCatchUp.value = 0;
    seekTarget.value = null;
    setIsSeeking(true);
  };

  const onSeekComplete = (value: number) => {
    if (!currentRecording || duration <= 0) return;

    try {
      const clamped = Math.max(0, Math.min(value, duration));
      void seekTo(clamped);
      sliderProgress.value = clamped;
      // Begin catch-up phase: hold UI at target until audio reports similar position
      seekTarget.value = clamped;
      awaitingCatchUp.value = 1;
      isSeekingRef.value = 0;
      setIsSeeking(false);
    } catch (error) {
      console.error("Error seeking audio:", error);
      // Still reset seeking state even on error
      isSeekingRef.value = 0;
      setIsSeeking(false);
    }
  };

  const onValueChange = (value: number) => {
    // Ensure immediate gating to prevent sync effect from overriding during drag
    if (!isSeekingRef.value) {
      isSeekingRef.value = 1;
      setIsSeeking(true);
    }
    const clamped = duration > 0 ? Math.max(0, Math.min(value, duration)) : value;
    sliderProgress.value = clamped;
  };

  // Animate position based on tab bar presence
  useEffect(() => {
    const targetValue = hasTabBar ? 0 : 1;
    setTimeout(() => {
      slideAnim.value = withSpring(targetValue);
    }, 100);
  }, [hasTabBar, slideAnim]);

  // Handle slide-in animation when component becomes visible and slide-out when hidden
  useEffect(() => {
    if (isVisible) {
      // Animate in from below
      translateY.value = withSpring(0);
    } else {
      // When the bar should be hidden, move it off-screen
      translateY.value = withTiming(120, {
        duration: 200,
      });
      isSeekingRef.value = 0;
      setIsSeeking(false);
    }
  }, [isVisible, translateY, sliderProgress, sliderMin, sliderMax, isSeekingRef]);

  // Only render if we have a current recording
  if (!currentRecording) return null;

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
    headphonesText: {
      ...createThemedTextStyle(theme, {
        size: "xs",
        weight: "medium",
        color: "onSurfaceVariant",
      }),
    },
    inner: {
      backgroundColor: theme.colors.globalAudioBar,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      elevation: 12,
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
    secondaryTitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
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
    titleContainer: {
      flex: 1,
      minWidth: 0,
    },
    titleText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "semiBold",
        color: "onSurface",
      }),
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
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.titleText}>
                {currentRecording?.species?.common_name ||
                  `Recording ${currentRecording?.rec_number}`}{" "}
                •{" "}
                <Text style={styles.secondaryTitle} numberOfLines={1} ellipsizeMode="tail">
                  {currentRecording?.species?.scientific_name}
                </Text>
              </Text>
              {currentRecording?.caption && (
                <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  {currentRecording?.caption}
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
            <Text style={styles.headphonesText}>Best with headphones</Text>
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

// Higher-order component that wraps screens with GlobalAudioBar
type ScreenProps<
  T extends Record<string, object | undefined> = Record<string, object | undefined>,
> = {
  navigation: NativeStackNavigationProp<T>;
  route: RouteProp<T, keyof T>;
};

export const withGlobalAudioBar = <T extends Record<string, object | undefined>>(
  WrappedComponent: React.ComponentType<ScreenProps<T>>
) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (props: ScreenProps<T>) => (
    <View style={styles.container}>
      <WrappedComponent {...props} />
      <GlobalAudioBar />
    </View>
  );
};

export default GlobalAudioBar;
