import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackgroundPattern from "../components/BackgroundPattern";
import CustomModal from "../components/CustomModal";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import RecordingCard from "../components/RecordingCard";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme";
import type { DownloadRecord } from "../types";

const { width } = Dimensions.get("window");

const OfflineScreen = () => {
  const { totalStorageUsed, getDownloadedRecordings } = useContext(DownloadContext);
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const globalAudioBarHeight = useGlobalAudioBarHeight();

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Load downloaded recordings from database
  const loadDownloads = useCallback(async () => {
    setIsLoading(true);
    try {
      const downloadedRecordings = await getDownloadedRecordings();
      // Map the downloaded recordings to match the DownloadedRecording type
      const formattedRecordings = downloadedRecordings.map((record) => ({
        recording: record.recording,
        recording_id: record.recording_id,
        audio_path: record.audio_path,
        downloaded_at: record.downloaded_at,
        title: record.title,
        species_name: record.species_name,
        scientific_name: record.scientific_name,
        book_page_number: record.book_page_number,
        caption: record.caption,
      }));
      setDownloads(formattedRecordings);
    } catch (error) {
      console.error("Error loading downloads:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [getDownloadedRecordings]);

  // Check for downloads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDownloads();
      return () => {
        // Optional cleanup if needed
      };
    }, [loadDownloads])
  );

  // Initial load when component mounts
  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  // Create styles with theme support
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    emptyCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 4,
      padding: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      width: width * 0.8,
    },
    emptyContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    emptyText: {
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: theme.spacing.sm,
      textAlign: "center",
    },
    emptyTitle: {
      ...createThemedTextStyle(theme, {
        size: "lg",
        weight: "bold",
        color: "onSurface",
      }),
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: theme.borderRadius.lg,
      borderBottomRightRadius: theme.borderRadius.lg,
      elevation: 4,
      paddingTop: theme.spacing.md + insets.top,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      zIndex: theme.zIndex.base,
    },
    headerInner: {
      paddingHorizontal: theme.spacing.md,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
    },
    listContent: {
      padding: theme.spacing.md,
      paddingBottom: globalAudioBarHeight,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 4,
      padding: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      width: width * 0.8,
    },
    loadingContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.md,
    },
    loadingText: {
      color: theme.colors.onSurface,
      ...createThemedTextStyle(theme, {
        size: "sm",
        weight: "normal",
        color: "onSurface",
      }),
      marginTop: theme.spacing.md,
      textAlign: "center",
    },

    separator: {
      height: theme.spacing.md,
    },
    storageInfo: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      flexDirection: "row",
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    storageInfoIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.tertiary,
      borderRadius: theme.borderRadius.full,
      height: 40,
      justifyContent: "center",
      marginRight: theme.spacing.md,
      width: 40,
    },
    storageInfoText: {
      flex: 1,
    },
  });

  // Render download item
  const renderDownloadItem = ({ item }: { item: DownloadRecord }) => {
    const handleItemPress = () => {
      setShowOfflineModal(true);
    };

    return (
      <RecordingCard
        item={item}
        onPress={handleItemPress}
        showPlayButton={true}
        showDeleteButton={false}
      />
    );
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Ionicons name="cloud-offline-outline" size={60} color={theme.colors.primary} />
        <Text style={styles.emptyTitle}>No Offline Content</Text>
        <Text style={styles.emptyText}>
          You don&apos;t have any downloaded recordings. Connect to the internet to browse and
          download recordings for offline use.
        </Text>
      </View>
    </View>
  );

  // Custom header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headerRow}>
          <View>
            <Text
              style={createThemedTextStyle(theme, {
                size: "6xl",
                weight: "bold",
                color: "secondary",
              })}
            >
              Offline Mode
            </Text>
            <Text
              style={createThemedTextStyle(theme, {
                size: "lg",
                weight: "normal",
                color: "onSurfaceVariant",
              })}
            >
              Your downloaded recordings
            </Text>
          </View>
        </View>
      </View>

      {downloads.length > 0 && (
        <View style={styles.storageInfo}>
          <View style={styles.storageInfoIcon}>
            <Ionicons name="folder" size={20} color={theme.colors.onTertiary} />
          </View>
          <View style={styles.storageInfoText}>
            <Text
              style={createThemedTextStyle(theme, {
                size: "lg",
                weight: "bold",
                color: "onSurface",
              })}
            >
              {downloads.length} recording{downloads.length !== 1 ? "s" : ""} available
            </Text>
            <Text
              style={createThemedTextStyle(theme, {
                size: "sm",
                weight: "normal",
                color: "onSurfaceVariant",
              })}
            >
              Using {formatBytes(totalStorageUsed)} of storage
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <Header />

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading offline content...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundPattern />
      <Header />

      <FlatList
        data={downloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.recording_id.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDownloads();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Offline Mode Modal */}
      <CustomModal
        visible={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        title="Offline Mode"
        message="Recording details are not available while offline. You can still play downloaded recordings."
        icon="cloud-offline-outline"
        iconColor={theme.colors.primary}
        buttons={[
          {
            text: "OK",
            onPress: () => setShowOfflineModal(false),
            style: "default",
          },
        ]}
      />
    </View>
  );
};

export default OfflineScreen;
