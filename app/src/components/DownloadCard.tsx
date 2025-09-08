import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  withDelay,
} from "react-native-reanimated";

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
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const cardHeight = useSharedValue(1);
  const [isRevealed, setIsRevealed] = useState(false);

  const SWIPE_THRESHOLD = -100;
  const DELETE_ZONE_WIDTH = 80;

  // Handle delete animation with slide up effect
  useEffect(() => {
    if (isDeleting) {
      // First fade out the card with smooth timing
      opacity.value = withTiming(0, { duration: 200 });

      // Then collapse the height with spring for smooth transition
      cardHeight.value = withDelay(
        150,
        withSpring(0, {
          damping: 20,
          stiffness: 300,
          mass: 0.8,
        })
      );
    }
  }, [isDeleting, opacity, cardHeight]);

  // Handle slide-up animation for items below deleted item
  useEffect(() => {
    if (animationDelay > 0) {
      // Start with items slightly below their final position
      translateY.value = 20;
      // Then animate to final position with smooth spring
      translateY.value = withDelay(
        animationDelay,
        withSpring(0, {
          damping: 25,
          stiffness: 400,
          mass: 0.6,
        })
      );
    }
  }, [animationDelay, translateY]);

  const styles = StyleSheet.create({
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
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      lineHeight: 18,
      marginTop: theme.spacing.xxs,
    },
    contentContainer: {
      flex: 1,
      justifyContent: "center",
      minWidth: 0,
      paddingRight: theme.spacing.md,
    },
    deleteActionContainer: {
      alignItems: "center",
      height: "100%",
      justifyContent: "center",
      position: "absolute",
      right: 0,
      top: 0,
      width: DELETE_ZONE_WIDTH,
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 28,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    downloadCard: {
      backgroundColor: theme.colors.transparent,
      marginHorizontal: theme.spacing.xxs,
      marginVertical: theme.spacing.xxs,
      overflow: "hidden",
      position: "relative",
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
      ...createThemedTextStyle(theme, {
        size: "xs",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.xxs,
      opacity: 0.7,
    },
    headerRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
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
      ...createThemedTextStyle(theme, {
        size: "xl",
        weight: "bold",
        color: "onPrimaryContainer",
      }),
      fontSize: 18,
    },
    secondaryTitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    titleRow: {
      alignItems: "center",
      flexDirection: "row",
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

  const formatDownloadDate = (dateString: number) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Downloaded today";
    if (diffDays === 2) return "Downloaded yesterday";
    if (diffDays <= 7) return `Downloaded ${diffDays} days ago`;
    return `Downloaded ${date.toLocaleDateString()}`;
  };

  // Pan gesture strictly limited to left-swipe movement so vertical scrolling remains responsive
  const panGesture = Gesture.Pan()
    // Require reasonable horizontal swipe distance before activation to avoid intercepting vertical scroll
    .minDistance(15)
    // Only activate when swiping left (negative X) beyond threshold
    .activeOffsetX([-25, 0])
    // Fail (let parent scroll) if vertical movement exceeds a small value
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Only process if this is primarily a horizontal gesture
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);

      if (absX > absY && absX > 10) {
        if (isRevealed) {
          // When revealed, calculate new position based on current position + translation
          // Allow dragging back to the right (towards 0) but not beyond it
          const newTranslateX = Math.min(0, SWIPE_THRESHOLD + event.translationX);
          translateX.value = newTranslateX;
        } else {
          // When not revealed, only allow leftward movement (negative translationX)
          const newTranslateX = Math.min(0, event.translationX);
          translateX.value = newTranslateX;
        }
      }
    })
    .onEnd((event) => {
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);

      // Only process if this was primarily a horizontal gesture
      if (absX > absY && absX > 10) {
        if (isRevealed) {
          // If currently revealed, check if dragged back far enough to close
          const finalPosition = SWIPE_THRESHOLD + event.translationX;
          if (finalPosition > SWIPE_THRESHOLD / 2) {
            // Close the delete action
            translateX.value = withSpring(0, {
              damping: 15,
              stiffness: 200,
            });
            runOnJS(setIsRevealed)(false);
          } else {
            // Keep it revealed
            translateX.value = withSpring(SWIPE_THRESHOLD, {
              damping: 15,
              stiffness: 200,
            });
          }
        } else {
          // Not revealed, check if should reveal
          if (event.translationX < SWIPE_THRESHOLD) {
            // Swipe threshold reached - show delete action
            translateX.value = withSpring(SWIPE_THRESHOLD, {
              damping: 15,
              stiffness: 200,
            });
            runOnJS(setIsRevealed)(true);
          } else {
            // Snap back to original position
            translateX.value = withSpring(0, {
              damping: 15,
              stiffness: 200,
            });
            runOnJS(setIsRevealed)(false);
          }
        }
      } else {
        // If not a horizontal gesture, reset position
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
        runOnJS(setIsRevealed)(false);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value === 0 ? 0 : undefined,
      marginVertical: cardHeight.value === 0 ? 0 : undefined,
      overflow: "hidden",
    };
  });

  const deleteActionAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / DELETE_ZONE_WIDTH;
    const clampedProgress = Math.min(1, progress);

    return {
      opacity: clampedProgress * opacity.value, // Apply both reveal and delete fade
      transform: [{ scale: clampedProgress }],
    };
  });

  const handleDeletePress = () => {
    onDeletePress?.();
    // Don't reset position immediately - let the parent handle it
  };

  const resetPosition = useCallback(() => {
    setIsRevealed(false);
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
    });
  }, [translateX]);

  // Handle shouldResetPosition prop
  useEffect(() => {
    if (shouldResetPosition) {
      resetPosition();
    }
  }, [shouldResetPosition, resetPosition]);

  const handleCardPress = () => {
    if (isRevealed) {
      resetPosition();
    } else {
      onPress();
    }
  };

  return (
    <Animated.View style={[styles.downloadCard, containerAnimatedStyle]}>
      {/* Delete Action Background */}
      {showDeleteButton && (
        <View style={styles.deleteActionContainer}>
          <Animated.View style={deleteActionAnimatedStyle}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.onErrorContainer} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Main Card Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={styles.downloadCardContent}
            onPress={handleCardPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Downloaded recording ${item.rec_number || "Unknown"}: ${item.species?.common_name || "Unknown species"}`}
            accessibilityHint="Tap to view recording details, or swipe left to delete"
          >
            {/* Enhanced Poster Element */}
            <View style={styles.posterContainer}>
              <View style={styles.posterOverlay}>
                <Text style={styles.posterText}>{item.rec_number}</Text>
              </View>

              {/* Download Badge - positioned at top-right corner */}

              <View style={styles.badgeContainer}>
                <DownloadedBadge compact smallRound />
              </View>
            </View>
            {/* Content Section */}
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <View style={styles.leftContent}>
                  {/* Species Title with Download Indicator */}
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

                  {/* Caption */}
                  {item.caption && (
                    <Text style={styles.caption} numberOfLines={1} ellipsizeMode="tail">
                      {item.caption}
                    </Text>
                  )}

                  {/* Download Date */}
                  <Text style={styles.downloadDate}>{formatDownloadDate(item.downloaded_at)}</Text>
                </View>
              </View>
            </View>

            {/* Audio Player */}
            {showPlayButton && (
              <View style={styles.actionContainer}>
                <MiniAudioPlayer recording={item} size={44} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

export default DownloadCard;
