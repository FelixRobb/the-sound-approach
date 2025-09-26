/* eslint-disable react-native/sort-styles */
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
// Use Swipeable for robust swipe-to-delete and TouchableOpacity for compatibility
import { Pressable } from "react-native-gesture-handler";
import Swipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme";
import type { DownloadRecord } from "../types";

import DownloadedBadge from "./DownloadedBadge";
import MiniAudioPlayer from "./MiniAudioPlayer";

interface DownloadCardProps {
  item: DownloadRecord;
  onPress: () => void;
  showDeleteButton?: boolean;
  onDeletePress?: () => void;
  showPlayButton?: boolean;
  shouldResetPosition?: boolean;
  isDeleting?: boolean;
  animationDelay?: number;
}
const RightSwipeAction = ({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) => {
  const { theme } = useEnhancedTheme();
  // This hook is now correctly called inside a React component.
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));
  const styles = StyleSheet.create({
    deleteActionContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: 80, // Matches DELETE_ZONE_WIDTH
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 28,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
  });

  return (
    <View style={styles.deleteActionContainer}>
      <Pressable style={styles.deleteButton} onPress={onPress}>
        <Animated.View style={animatedStyle}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.onErrorContainer} />
        </Animated.View>
      </Pressable>
    </View>
  );
};
const DownloadCard: React.FC<DownloadCardProps> = ({
  item,
  onPress,
  showDeleteButton = false,
  onDeletePress,
  showPlayButton = true,
  shouldResetPosition = false,
  isDeleting = false,
  animationDelay = 0,
}) => {
  const { theme } = useEnhancedTheme();
  const { downloads, resumeDownload } = useContext(DownloadContext);
  const swipeableRef = useRef<SwipeableMethods>(null);

  // Animation values for add/delete animations
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const cardHeight = useSharedValue(1);

  // State to track if the delete action is revealed
  const [isRevealed, setIsRevealed] = useState(false);

  const downloadStatus = downloads[item.recording_id];
  const isDownloading = downloadStatus?.status === "downloading";
  const isPaused = downloadStatus?.status === "paused";
  const hasError = downloadStatus?.status === "error";
  const progress = downloadStatus?.progress || 0;

  const handleResumePress = async () => {
    if (isPaused && downloadStatus) {
      try {
        await resumeDownload(item.recording_id);
      } catch (error) {
        console.error("Failed to resume download:", error);
      }
    }
  };

  // Animate card out when deleting
  useEffect(() => {
    if (isDeleting) {
      opacity.value = withTiming(0, { duration: 200 });
      cardHeight.value = withDelay(150, withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 }));
    }
  }, [isDeleting, opacity, cardHeight]);

  // Animate card in when a card above is deleted
  useEffect(() => {
    if (animationDelay > 0) {
      translateY.value = 20;
      translateY.value = withDelay(
        animationDelay,
        withSpring(0, { damping: 25, stiffness: 400, mass: 0.6 })
      );
    }
  }, [animationDelay, translateY]);

  // Close swipeable row if shouldResetPosition becomes true
  useEffect(() => {
    if (shouldResetPosition && isRevealed) {
      swipeableRef.current?.close();
    }
  }, [shouldResetPosition, isRevealed]);

  const styles = StyleSheet.create({
    tappableArea: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    actionContainer: {
      alignItems: "center",
      flexShrink: 0,
      justifyContent: "center",
    },
    badgeContainer: {
      position: "absolute",
      right: -2,
      top: -2,
      zIndex: 10,
    },
    caption: {
      ...createThemedTextStyle(theme, { size: "sm", weight: "normal", color: "onSurfaceVariant" }),
      lineHeight: 18,
      marginTop: theme.spacing.xxs,
    },
    contentContainer: {
      flex: 1,
      justifyContent: "center",
      minWidth: 0,
      paddingRight: theme.spacing.md,
    },

    downloadCard: {
      backgroundColor: theme.colors.transparent,
      marginHorizontal: theme.spacing.xxs,
      overflow: "hidden",
    },
    downloadCardContent: {
      alignItems: "center",
      backgroundColor: theme.colors.transparent,
      borderRadius: theme.borderRadius.md,
      flexDirection: "row",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    downloadDate: {
      ...createThemedTextStyle(theme, { size: "xs", weight: "normal", color: "onSurfaceVariant" }),
      marginTop: theme.spacing.xxs,
      opacity: 0.7,
    },
    downloadStatusContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    downloadStatusText: {
      ...createThemedTextStyle(theme, { size: "xs", weight: "medium", color: "onSurfaceVariant" }),
      flex: 1,
    },
    errorText: {
      ...createThemedTextStyle(theme, { size: "xs", weight: "medium", color: "error" }),
    },
    leftContent: {
      flex: 1,
      minWidth: 0,
    },
    posterContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      elevation: 3,
      flexShrink: 0,
      height: 54,
      justifyContent: "center",
      marginRight: theme.spacing.md,
      position: "relative",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      width: 54,
    },
    posterOverlay: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.borderRadius.lg - 1,
      bottom: 1,
      justifyContent: "center",
      left: 1,
      position: "absolute",
      right: 1,
      top: 1,
    },
    posterText: {
      ...createThemedTextStyle(theme, { size: "xl", weight: "bold", color: "onPrimaryContainer" }),
      fontSize: 18,
    },
    progressBar: {
      backgroundColor: theme.colors.primary,
      height: "100%",
    },
    progressContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      height: 4,
      marginTop: theme.spacing.xs,
      overflow: "hidden",
      width: "100%",
    },
    resumeButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    resumeButtonText: {
      ...createThemedTextStyle(theme, { size: "sm", weight: "medium", color: "onPrimary" }),
    },
    secondaryTitle: {
      ...createThemedTextStyle(theme, { size: "lg", weight: "normal", color: "onSurfaceVariant" }),
    },
    titleRow: {
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
      minWidth: 0,
    },
    titleText: {
      ...createThemedTextStyle(theme, { size: "lg", weight: "semiBold", color: "onSurface" }),
    },
  });

  const formatDownloadDate = (dateString: number) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Downloaded today";
    if (diffDays === 1) return "Downloaded yesterday";
    if (diffDays <= 7) return `Downloaded ${diffDays} days ago`;
    return `Downloaded on ${date.toLocaleDateString()}`;
  };

  const handleCardPress = () => {
    if (isRevealed) {
      swipeableRef.current?.close();
    } else {
      onPress();
    }
  };
  // A new component to render the swipe action, allowing hooks to be used correctly.

  const handleDeletePress = useCallback(() => {
    swipeableRef.current?.close();
    onDeletePress?.();
  }, [onDeletePress]);

  // This function now renders the new component, passing the animated value and props down.
  const renderRightActions = useCallback(
    (progress: SharedValue<number>) => {
      return <RightSwipeAction progress={progress} onPress={handleDeletePress} />;
    },
    [handleDeletePress] // Add theme and styles to the dependency array
  );

  // Animated style for the root container, handling collapse/fade and slide-up
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: cardHeight.value === 0 ? 0 : undefined,
    marginVertical: cardHeight.value === 0 ? 0 : theme.spacing.xxs,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    overflow: "hidden",
  }));

  return (
    <Animated.View style={[styles.downloadCard, containerAnimatedStyle]}>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        renderRightActions={showDeleteButton ? renderRightActions : undefined}
        onSwipeableWillOpen={() => scheduleOnRN(setIsRevealed, true)}
        onSwipeableWillClose={() => scheduleOnRN(setIsRevealed, false)}
        overshootRight={false}
      >
        {/* This View is now the direct child, containing two separate pressable areas */}
        <View style={styles.downloadCardContent}>
          {/* AREA 1: The main pressable area for navigation */}
          <Pressable style={styles.tappableArea} onPress={handleCardPress}>
            <View style={styles.posterContainer}>
              <View style={styles.posterOverlay}>
                <Text style={styles.posterText}>{item.rec_number}</Text>
              </View>
              <View style={styles.badgeContainer}>
                <DownloadedBadge compact smallRound />
              </View>
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.leftContent}>
                <View style={styles.titleRow}>
                  {item.species && (
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.titleText}>
                      {item.species.common_name || `Recording ${item.rec_number}`} •{" "}
                      <Text style={styles.secondaryTitle} numberOfLines={1} ellipsizeMode="tail">
                        {item.species.scientific_name}
                      </Text>
                    </Text>
                  )}
                </View>
                {item.caption && (
                  <Text style={styles.caption} numberOfLines={1} ellipsizeMode="tail">
                    {item.caption}
                  </Text>
                )}
                <Text style={styles.downloadDate}>{formatDownloadDate(item.downloaded_at)}</Text>
                {(isDownloading || isPaused || hasError) && (
                  <View>
                    <View style={styles.downloadStatusContainer}>
                      <Text style={hasError ? styles.errorText : styles.downloadStatusText}>
                        {isDownloading && `Downloading... ${Math.round(progress * 100)}%`}
                        {isPaused && `Paused at ${Math.round(progress * 100)}%`}
                        {hasError && downloadStatus?.error}
                      </Text>
                      {isPaused && (
                        <Pressable
                          style={styles.resumeButton}
                          onPress={() => void handleResumePress()}
                        >
                          <Text style={styles.resumeButtonText}>Resume</Text>
                        </Pressable>
                      )}
                    </View>
                    {(isDownloading || isPaused) && (
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </Pressable>

          {/* AREA 2: The audio player, now a sibling and not nested */}
          {showPlayButton && downloadStatus?.status === "completed" && (
            <View style={styles.actionContainer}>
              <MiniAudioPlayer recording={item} size={44} />
            </View>
          )}
        </View>
      </Swipeable>
    </Animated.View>
  );
};

export default DownloadCard;
