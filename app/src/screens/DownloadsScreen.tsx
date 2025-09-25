import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackgroundPattern from "../components/BackgroundPattern";
import CustomModal from "../components/CustomModal";
import DownloadCard from "../components/DownloadCard";
import { useGlobalAudioBarHeight } from "../components/GlobalAudioBar";
import { Button } from "../components/ui";
import { DownloadContext } from "../context/DownloadContext";
import { useEnhancedTheme } from "../context/EnhancedThemeProvider";
import { createThemedTextStyle } from "../lib/theme/typography";
import type { DownloadRecord, RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

const DownloadsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList>>();
  const { totalStorageUsed, deleteDownload, clearAllDownloads, getDownloadedRecordings } =
    useContext(DownloadContext);
  const { theme } = useEnhancedTheme();
  const insets = useSafeAreaInsets();
  const globalAudioBarHeight = useGlobalAudioBarHeight();
  const showBackButton =
    route.name === "DownloadsManager" ||
    (!!route.params && (route.params as { showBackButton?: boolean }).showBackButton === true);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState<DownloadRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [resetPositionForItem, setResetPositionForItem] = useState<string | null>(null);

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
  const loadDownloads = useCallback(
    async (showLoadingScreen = true) => {
      if (showLoadingScreen && !hasInitiallyLoaded) {
        setIsLoading(true);
      }
      try {
        const downloadedRecordings = await getDownloadedRecordings();
        setDownloads(downloadedRecordings);
        if (!hasInitiallyLoaded) {
          setHasInitiallyLoaded(true);
        }
      } catch (error) {
        console.error("Error loading downloads:", error);
      } finally {
        if (showLoadingScreen) {
          setIsLoading(false);
        }
        setRefreshing(false);
      }
    },
    [getDownloadedRecordings, hasInitiallyLoaded]
  );

  // Check for downloads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Don't reload if we're in the middle of deleting items
      if (deletingItems.size === 0) {
        // Load silently after initial load to avoid loading screen
        void loadDownloads(false);
      }
      return () => {
        // Optional cleanup if needed
      };
    }, [loadDownloads, deletingItems.size])
  );

  // Initial load when component mounts - show loading screen
  useEffect(() => {
    void loadDownloads(true);
  }, [loadDownloads]);

  // Handle delete download
  const handleDeleteDownload = (item: DownloadRecord) => {
    setSelectedDownload(item);
    setShowDeleteModal(true);
  };

  // Handle cancel delete - reset position
  const handleCancelDelete = () => {
    if (selectedDownload) {
      // Trigger reset for the specific item
      setResetPositionForItem(selectedDownload.recording_id);
      // Clear the reset flag after a brief delay
      setTimeout(() => {
        setResetPositionForItem(null);
      }, 100);
    }
    setShowDeleteModal(false);
    setSelectedDownload(null);
  };

  // Handle clear all downloads
  const handleClearAllDownloads = () => {
    setShowClearAllModal(true);
  };

  const confirmDeleteDownload = async () => {
    if (!selectedDownload) return;

    setIsDeleting(true);
    setShowDeleteModal(false);

    // Mark this item as deleting for animation
    setDeletingItems((prev) => new Set(prev).add(selectedDownload.recording_id));

    try {
      await deleteDownload(selectedDownload.recording_id);

      // Don't remove from downloads array immediately - let the animation complete
      // The animation will handle the visual removal

      // Wait for the complete animation sequence to finish
      // Initial fade (200ms) + delay (150ms) + spring collapse + spring slide-ups + buffer = 900ms
      setTimeout(() => {
        setDownloads((prev) =>
          prev.filter((download) => download.recording_id !== selectedDownload.recording_id)
        );
        setDeletingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedDownload.recording_id);
          return newSet;
        });
      }, 900);
    } catch (error) {
      console.error("Delete error:", error);
      // Remove from deleting set on error
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedDownload.recording_id);
        return newSet;
      });
    } finally {
      setIsDeleting(false);
      setSelectedDownload(null);
    }
  };

  const confirmClearAllDownloads = async () => {
    setIsClearing(true);
    try {
      await clearAllDownloads();
      setDownloads([]);
    } catch (error) {
      console.error("Clear downloads error:", error);
    } finally {
      setIsClearing(false);
      setShowClearAllModal(false);
    }
  };

  // Create styles with theme support
  const styles = StyleSheet.create({
    backButton: {
      alignItems: "center",
      borderRadius: theme.borderRadius.lg,
      height: 40,
      justifyContent: "center",
      marginRight: theme.spacing.md,
      width: 40,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    emptyCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 4,
      padding: theme.spacing.xl,
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
      marginTop: 48,
      padding: theme.spacing.xl,
    },
    emptyText: {
      ...createThemedTextStyle(theme, {
        size: "base",
        weight: "normal",
        color: "onSurfaceVariant",
      }),
      marginTop: 8,
      textAlign: "center",
    },
    emptyTitle: {
      ...createThemedTextStyle(theme, {
        size: "xl",
        weight: "normal",
        color: "onSurface",
      }),
      marginTop: 16,
      textAlign: "center",
    },
    header: {
      paddingBottom: theme.spacing.sm,
      paddingTop: theme.spacing.sm + insets.top,
      zIndex: theme.zIndex.base,
    },
    headerInner: {
      paddingHorizontal: theme.spacing.xl,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.lg,
    },
    headerRowInner: {
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      elevation: 4,
      padding: theme.spacing.xl,
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
      padding: theme.spacing.xl,
    },
    loadingText: {
      ...createThemedTextStyle(theme, { size: "sm", weight: "medium", color: "onSurface" }),
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    storageInfo: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    storageInfoContainer: {
      marginLeft: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    storageInfoInner: {
      flexDirection: "column",
      flex: 1,
      gap: theme.spacing.xxs,
      justifyContent: "space-between",
    },
  });

  // Custom header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headerRow}>
          <View style={styles.headerRowInner}>
            {showBackButton && (
              <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            <View>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "6xl",
                  weight: "bold",
                  color: "secondary",
                })}
              >
                Downloads
              </Text>
              <Text
                style={createThemedTextStyle(theme, {
                  size: "lg",
                  weight: "normal",
                  color: "onSurfaceVariant",
                })}
              >
                Manage your offline recordings
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.storageInfoContainer}>
        <View style={styles.storageInfo}>
          <View style={styles.storageInfoInner}>
            <Text
              style={createThemedTextStyle(theme, {
                size: "lg",
                weight: "normal",
                color: "onSurface",
              })}
            >
              Storage used: {formatBytes(totalStorageUsed)}
            </Text>
            <Text
              style={createThemedTextStyle(theme, {
                size: "base",
                weight: "normal",
                color: "onSurfaceVariant",
              })}
            >
              Drag a recording to the left to delete it
            </Text>
          </View>
          <Button
            onPress={handleClearAllDownloads}
            disabled={downloads.length === 0}
            variant="default"
            size="md"
            backgroundColor={theme.colors.tertiary}
            textColor={theme.colors.onTertiary}
          >
            Clear All
          </Button>
        </View>
      </View>
    </View>
  );

  // Render download item with animation delay calculation
  const renderDownloadItem = ({ item, index }: { item: DownloadRecord; index: number }) => {
    const handleItemPress = () => {
      navigation.navigate("RecordingDetails", { recordingId: item.recording_id });
    };

    const handleDeletePress = () => {
      handleDeleteDownload(item);
    };

    // Calculate if this item should have a slide-up animation
    // Find if there's a deleting item above this one in the current list
    const deletingItemIndex = downloads.findIndex((download) =>
      deletingItems.has(download.recording_id)
    );

    // Only animate items that are below the deleting item and not deleting themselves
    const isItemDeleting = deletingItems.has(item.recording_id);
    const shouldAnimateUp =
      !isItemDeleting && deletingItemIndex !== -1 && index > deletingItemIndex;

    // Calculate delay: start after the delete item begins collapsing (350ms)
    // Add staggered delay based on distance from deleted item for smooth cascading effect
    const animationDelay = shouldAnimateUp ? 350 + (index - deletingItemIndex - 1) * 40 : 0;

    return (
      <DownloadCard
        item={item}
        onPress={handleItemPress}
        showPlayButton={true}
        showDeleteButton={true}
        onDeletePress={handleDeletePress}
        shouldResetPosition={resetPositionForItem === item.recording_id}
        isDeleting={isItemDeleting}
        animationDelay={animationDelay}
      />
    );
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Ionicons name="cloud-download-outline" size={60} color={theme.colors.primary} />
        <Text style={styles.emptyTitle}>No Downloads</Text>
        <Text style={styles.emptyText}>
          Downloaded recordings will appear here for offline listening.
        </Text>
      </View>
    </View>
  );

  // Loading state - only show on initial load
  if (isLoading && !refreshing && !hasInitiallyLoaded) {
    return (
      <View style={styles.container}>
        <BackgroundPattern />
        <Header />

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading downloads...</Text>
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
        keyExtractor={(item) => item.recording_id}
        contentContainerStyle={{ paddingBottom: globalAudioBarHeight }}
        ListEmptyComponent={<EmptyState />}
        removeClippedSubviews={false}
        windowSize={10}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              // Only allow refresh if no items are currently being deleted
              if (deletingItems.size === 0) {
                setRefreshing(true);
                void loadDownloads(false);
              }
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Delete Download Modal */}
      <CustomModal
        visible={showDeleteModal}
        onClose={handleCancelDelete}
        title="Delete Download"
        message={`Are you sure you want to delete "${selectedDownload?.species?.common_name || "this recording"}"? You'll need to download it again for offline use.`}
        icon="trash-outline"
        iconColor={theme.colors.error}
        buttons={[
          {
            text: "Cancel",
            onPress: handleCancelDelete,
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: () => void confirmDeleteDownload(),
            style: "destructive",
            loading: isDeleting,
          },
        ]}
      />

      {/* Clear All Downloads Modal */}
      <CustomModal
        visible={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Clear All Downloads"
        message="Are you sure you want to delete all downloads? This action cannot be undone and you'll need to download recordings again for offline use."
        icon="trash-outline"
        iconColor={theme.colors.error}
        buttons={[
          {
            text: "Cancel",
            onPress: () => setShowClearAllModal(false),
            style: "cancel",
          },
          {
            text: "Clear All",
            onPress: () => void confirmClearAllDownloads(),
            style: "destructive",
            loading: isClearing,
          },
        ]}
      />
    </View>
  );
};

export default DownloadsScreen;
