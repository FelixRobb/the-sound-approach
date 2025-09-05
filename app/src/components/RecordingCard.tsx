import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { Recording } from "../types";
import { RootStackParamList } from "../types";

import DownloadedBadge from "./DownloadedBadge";
import MiniAudioPlayer from "./MiniAudioPlayer";

interface RecordingCardProps {
  recording: Recording;
  isDownloaded?: boolean;
  indented?: boolean;
  sortBy?: "speciescommon" | "rec_number" | "speciesscientific";
  onPress?: () => void;
}

const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  isDownloaded = false,
  indented = false,
  sortBy = "rec_number",
  onPress,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    actionContainer: {
      alignItems: "center",
      flexShrink: 0,
      justifyContent: "center",
      marginLeft: theme.spacing.xs,
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
      alignItems: "flex-start",
      flex: 1,
      justifyContent: "center",
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
    recordingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.transparent,
      borderRadius: theme.borderRadius.md,
      flexDirection: "row",
      marginHorizontal: indented ? theme.spacing.xl : theme.spacing.xs,
      marginVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    secondaryTitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
    },
    speciesContainer: {
      alignItems: "flex-start",
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "semiBold",
        color: "onSurface",
      }),
      lineHeight: 22,
    },
    titleContainer: {
      flexDirection: "row",
      gap: theme.spacing.xs,
    },
    titleText: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "semiBold",
        color: "onSurface",
      }),
    },
  });

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("RecordingDetails", { recordingId: recording.id });
    }
  };

  const getTitle = (recording: Recording): React.ReactNode => {
    if (recording.species) {
      if (sortBy === "speciescommon" || sortBy === "rec_number") {
        return (
          <View style={styles.titleContainer}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.titleText}>
              {recording.species.common_name || `Recording ${recording.rec_number}`} •{" "}
              <Text style={styles.secondaryTitle} numberOfLines={1} ellipsizeMode="tail">
                {recording.species.scientific_name}
              </Text>
            </Text>
          </View>
        );
      } else if (sortBy === "speciesscientific") {
        return (
          <View style={styles.titleContainer}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.titleText}>
              {recording.species.scientific_name || `Recording ${recording.rec_number}`} •{" "}
            </Text>
            <Text style={styles.secondaryTitle} numberOfLines={1} ellipsizeMode="tail">
              {recording.species.common_name}
            </Text>
          </View>
        );
      }
    }
    return <Text>{`Recording ${recording.rec_number}`}</Text>;
  };

  return (
    <TouchableOpacity
      style={styles.recordingCard}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Play recording ${recording.rec_number}: ${recording.species?.common_name || "Unknown species"}`}
      accessibilityHint="Tap to view recording details"
    >
      {/* Enhanced Poster Element */}
      <View style={styles.posterContainer}>
        <View style={styles.posterOverlay}>
          <Text style={styles.posterText}>{recording.rec_number}</Text>
        </View>

        {/* Download Badge - positioned at top-right corner */}
        {isDownloaded && (
          <View style={styles.badgeContainer}>
            <DownloadedBadge compact smallRound />
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Species Title */}
        <View style={styles.speciesContainer}>
          <Text style={styles.title}>{getTitle(recording)}</Text>
        </View>

        {/* Additional Information */}
        {recording.caption && (
          <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
            {recording.caption.slice(0, 80)} {" • "} {recording.site_name || "Unknown site"}
          </Text>
        )}
      </View>

      {/* Audio Player */}
      <View style={styles.actionContainer}>
        <MiniAudioPlayer recording={recording} size={48} />
      </View>
    </TouchableOpacity>
  );
};

export default RecordingCard;
