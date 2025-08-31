import { Ionicons } from "@expo/vector-icons";
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
import PageBadge from "./PageBadge";

interface RecordingCardProps {
  recording: Recording;
  sortBy?: "title" | "species" | "page";
  isDownloaded?: boolean;
  showSpeciesInfo?: boolean;
  showCaption?: boolean;
  indented?: boolean;
}

const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  sortBy = "page",
  isDownloaded = false,
  showSpeciesInfo = true,
  showCaption = false,
  indented = false,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    actionContainer: {
      alignItems: "center",
      flexShrink: 0,
      justifyContent: "center",
      marginLeft: theme.spacing.sm,
    },
    badgeContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.xs,
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
    commonName: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      flexShrink: 1,
    },
    contentContainer: {
      flex: 1,
      justifyContent: "center",
      minWidth: 0,
    },

    metadataRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xxs,
    },

    posterContainer: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
      flexShrink: 0,
      height: 56,
      justifyContent: "center",
      marginRight: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      width: 56,
    },
    posterIcon: {
      opacity: 0.6,
    },
    recordingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.transparent,
      flexDirection: "row",
      marginHorizontal: indented ? theme.spacing.xl : 0,
      minHeight: 72,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    scientificName: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      flexShrink: 2,
      fontStyle: "italic",
      marginLeft: theme.spacing.xs,
    },
    speciesContainer: {
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "medium",
        color: "onSurface",
      }),
      lineHeight: 20,
      marginBottom: theme.spacing.xxs,
    },
  });

  const handlePress = () => {
    navigation.navigate("RecordingDetails", { recordingId: recording.id });
  };

  return (
    <TouchableOpacity
      style={styles.recordingCard}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Play recording: ${recording.title} by ${recording.species?.common_name || "Unknown species"}`}
      accessibilityHint="Tap to view recording details"
    >
      {/* Visual Poster Element - Like Spotify's album art */}
      <View style={styles.posterContainer}>
        <Ionicons
          name="musical-notes"
          size={24}
          color={theme.colors.primary}
          style={styles.posterIcon}
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {recording.title}
        </Text>

        {/* Species Information */}
        {showSpeciesInfo && sortBy !== "species" && recording.species && (
          <View style={styles.speciesContainer}>
            <Text style={styles.commonName} numberOfLines={1} ellipsizeMode="tail">
              {recording.species.common_name}
            </Text>
            {recording.species.scientific_name && (
              <Text style={styles.scientificName} numberOfLines={1} ellipsizeMode="tail">
                • {recording.species.scientific_name}
              </Text>
            )}
          </View>
        )}

        {/* Caption for species view */}
        {showCaption && sortBy === "species" && recording.caption && (
          <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
            {recording.caption}
          </Text>
        )}

        {/* Metadata Row with Badges */}
        <View style={styles.metadataRow}>
          <View style={styles.badgeContainer}>
            <PageBadge page={recording.book_page_number} />
            {isDownloaded && <DownloadedBadge />}
          </View>
        </View>
      </View>

      {/* Action Area */}
      <View style={styles.actionContainer}>
        <MiniAudioPlayer recording={recording} size={44} />
      </View>
    </TouchableOpacity>
  );
};

export default RecordingCard;
