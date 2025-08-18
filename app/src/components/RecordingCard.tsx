import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme";
import type { DownloadRecord } from "../types";

import MiniAudioPlayer from "./MiniAudioPlayer";
import PageBadge from "./PageBadge";

interface RecordingCardProps {
  item: DownloadRecord;
  onPress: () => void;
  showDeleteButton?: boolean;
  onDeletePress?: () => void;
  showPlayButton?: boolean;
}

const RecordingCard: React.FC<RecordingCardProps> = ({
  item,
  onPress,
  showDeleteButton = false,
  onDeletePress,
  showPlayButton = true,
}) => {
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    downloadCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      overflow: "hidden",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
    },
    downloadContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    downloadDate: {
      ...createThemedTextStyle(theme, { size: "xs", weight: "normal", color: "onSurfaceVariant" }),
      marginTop: 4,
    },
    downloadHeader: {
      borderBottomColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    downloadInfo: {
      flex: 1,
    },
    downloadActions: {
      alignItems: "center",
      flexDirection: "row",
    },
    pageBadgeWrapper: {
      alignSelf: "flex-start",
      marginVertical: theme.spacing.xs,
    },
    playButton: {
      marginRight: theme.spacing.md,
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.full,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
  });

  return (
    <TouchableOpacity style={styles.downloadCard} onPress={onPress}>
      <View style={styles.downloadHeader}>
        <Text
          style={createThemedTextStyle(theme, {
            size: "xl",
            weight: "bold",
            color: "primary",
          })}
        >
          {item.title || "Unknown Recording"}
        </Text>
        <Text
          style={createThemedTextStyle(theme, {
            size: "base",
            weight: "normal",
            color: "onSurfaceVariant",
          })}
        >
          {item.scientific_name || ""}
        </Text>
      </View>

      <View style={styles.downloadContent}>
        <View style={styles.downloadInfo}>
          <Text
            style={createThemedTextStyle(theme, {
              size: "base",
              weight: "normal",
              color: "onSurface",
            })}
          >
            {item.species_name || "Unknown Species"}
          </Text>

          {item.book_page_number && (
            <View style={styles.pageBadgeWrapper}>
              <PageBadge page={item.book_page_number} />
            </View>
          )}

          <Text style={styles.downloadDate}>
            Downloaded: {new Date(item.downloaded_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.downloadActions}>
          {showPlayButton && (
            <View style={styles.playButton}>
              <MiniAudioPlayer recording={item.recording} size={40} />
            </View>
          )}

          {showDeleteButton && onDeletePress && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDeletePress}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.onError} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RecordingCard;
